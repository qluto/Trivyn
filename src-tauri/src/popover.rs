//! ポップオーバーウィンドウの表示・非表示と状態管理
//!
//! - トレイアイコンの直下（または直上）に位置合わせして表示する
//! - 通常表示（sticky = false）はフォーカスを失うと自動で閉じる
//! - リフレクションリマインダーからの表示（sticky = true）は明示的に閉じるまで残す

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{AppHandle, Emitter, Manager, Monitor, Rect, Runtime, WebviewWindow};

use crate::reflection_reminder::PeriodChangeEvent;

pub const POPOVER_LABEL: &str = "popover";

/// ブラー直後のトレイクリックを「閉じる操作」とみなす猶予時間
const BLUR_CLICK_GUARD: Duration = Duration::from_millis(300);

/// トレイアイコンとポップオーバーの間隔（論理ピクセル）
const ANCHOR_GAP: f64 = 6.0;

/// 画面端からの余白（論理ピクセル）
const EDGE_MARGIN: f64 = 8.0;

#[derive(Default)]
pub struct PopoverState {
    /// true の間はフォーカスを失っても閉じない
    sticky: AtomicBool,
    /// 最後にブラーで自動的に閉じた時刻
    last_blur_hide: Mutex<Option<Instant>>,
    /// フロントエンドに未取得のリフレクション促し
    pending_reflection: Mutex<Option<PeriodChangeEvent>>,
}

impl PopoverState {
    pub fn is_sticky(&self) -> bool {
        self.sticky.load(Ordering::SeqCst)
    }

    pub fn record_blur_hide(&self) {
        *self.last_blur_hide.lock().unwrap() = Some(Instant::now());
    }

    /// 直近にブラーで閉じたばかりか（トレイクリックとの競合判定用）
    pub fn was_just_hidden_by_blur(&self) -> bool {
        self.last_blur_hide
            .lock()
            .unwrap()
            .map(|t| t.elapsed() < BLUR_CLICK_GUARD)
            .unwrap_or(false)
    }

    pub fn set_pending_reflection(&self, event: PeriodChangeEvent) {
        *self.pending_reflection.lock().unwrap() = Some(event);
    }

    pub fn take_pending_reflection(&self) -> Option<PeriodChangeEvent> {
        self.pending_reflection.lock().unwrap().take()
    }
}

/// トレイアイコンの位置にポップオーバーを合わせて表示する
///
/// `anchor` はトレイアイコンの矩形。None の場合は保存済みトレイから取得し、
/// それも無ければプライマリモニターの右上に表示する。
/// フォーカスは奪わない（必要なら呼び出し側で `set_focus` する）。
pub fn show_popover<R: Runtime>(app: &AppHandle<R>, anchor: Option<Rect>, sticky: bool) {
    let Some(window) = app.get_webview_window(POPOVER_LABEL) else {
        return;
    };

    if let Some(state) = app.try_state::<PopoverState>() {
        state.sticky.store(sticky, Ordering::SeqCst);
    }

    let anchor = anchor.or_else(|| crate::tray::tray_rect(app));
    if let Err(e) = position_popover(app, &window, anchor) {
        eprintln!("Failed to position popover: {}", e);
    }

    let _ = window.show();
    // フォーカスを伴わない表示でもフロントエンドが再計測できるよう通知
    let _ = app.emit_to(POPOVER_LABEL, "popover-shown", ());
}

/// ポップオーバーを閉じ、sticky 状態を解除する
pub fn hide_popover<R: Runtime>(app: &AppHandle<R>) {
    if let Some(state) = app.try_state::<PopoverState>() {
        state.sticky.store(false, Ordering::SeqCst);
    }
    if let Some(window) = app.get_webview_window(POPOVER_LABEL) {
        let _ = window.hide();
    }
    notify_hidden(app);
}

/// フロントエンドに非表示を通知（表示中のバナー等をリセットさせる）
pub fn notify_hidden<R: Runtime>(app: &AppHandle<R>) {
    let _ = app.emit_to(POPOVER_LABEL, "popover-hidden", ());
}

/// トレイアイコンの物理座標矩形 (x, y, width, height)。サイズ 0 は無効とみなす
fn anchor_physical_rect<R: Runtime>(app: &AppHandle<R>, rect: &Rect) -> Option<(f64, f64, f64, f64)> {
    // Physical の場合は scale_factor は使われない。Logical の場合はプライマリモニターの倍率で近似
    let scale = app
        .primary_monitor()
        .ok()
        .flatten()
        .map(|m| m.scale_factor())
        .unwrap_or(1.0);
    let pos = rect.position.to_physical::<f64>(scale);
    let size = rect.size.to_physical::<f64>(scale);
    if size.width <= 0.0 || size.height <= 0.0 {
        return None;
    }
    Some((pos.x, pos.y, size.width, size.height))
}

/// 物理座標の点を含むモニターを探す
fn monitor_containing<R: Runtime>(app: &AppHandle<R>, x: f64, y: f64) -> Option<Monitor> {
    let monitors = app.available_monitors().ok()?;
    monitors.into_iter().find(|m| {
        let p = m.position();
        let s = m.size();
        x >= p.x as f64
            && x < p.x as f64 + s.width as f64
            && y >= p.y as f64
            && y < p.y as f64 + s.height as f64
    })
}

#[cfg(target_os = "macos")]
fn position_popover<R: Runtime>(
    app: &AppHandle<R>,
    window: &WebviewWindow<R>,
    anchor: Option<Rect>,
) -> tauri::Result<()> {
    use tauri::LogicalPosition;

    // ウィンドウの論理サイズ（モニターをまたいでも不変）
    let win_scale = window.scale_factor()?;
    let win_size = window.outer_size()?.to_logical::<f64>(win_scale);

    // トレイアイコンの座標がどのモニターにも載っていない場合（画面ロック中などは画面外の
    // 座標が返ることがある）はアンカー無しとして扱い、右上フォールバックに回す
    let anchored = anchor
        .and_then(|r| anchor_physical_rect(app, &r))
        .and_then(|a| monitor_containing(app, a.0 + a.2 / 2.0, a.1 + a.3 / 2.0).map(|m| (a, m)));
    let (anchor, monitor) = match anchored {
        Some((a, m)) => (Some(a), m),
        None => match app.primary_monitor().ok().flatten() {
            Some(m) => (None, m),
            None => return Ok(()),
        },
    };

    // macOS では論理座標 = ポイントでグローバルに一貫しているため、
    // 対象モニターの倍率で論理座標に変換してから配置する
    let scale = monitor.scale_factor();
    let to_logical = |v: f64| v / scale;

    let mon_x = to_logical(monitor.position().x as f64);
    let mon_y = to_logical(monitor.position().y as f64);
    let mon_w = to_logical(monitor.size().width as f64);
    let mon_h = to_logical(monitor.size().height as f64);

    let work = monitor.work_area();
    let work_x = to_logical(work.position.x as f64);
    let work_y = to_logical(work.position.y as f64);
    let work_w = to_logical(work.size.width as f64);

    let (x, y) = match anchor {
        Some((ax, ay, aw, ah)) => {
            let (ax, ay, aw, ah) = (to_logical(ax), to_logical(ay), to_logical(aw), to_logical(ah));

            // アイコン中心に水平中央揃え
            let x = ax + aw / 2.0 - win_size.width / 2.0;

            // トレイが画面上半分なら直下、下半分なら直上
            let tray_on_top = ay + ah / 2.0 < mon_y + mon_h / 2.0;
            let y = if tray_on_top {
                ay + ah + ANCHOR_GAP
            } else {
                ay - win_size.height - ANCHOR_GAP
            };
            (x, y)
        }
        None => {
            // トレイ位置不明: 作業領域の右上
            (
                work_x + work_w - win_size.width - EDGE_MARGIN,
                work_y + EDGE_MARGIN,
            )
        }
    };

    // モニター内に収める（メニューバー直下はトレイ直下なのでモニター全体でクランプ）
    let x = clamp(x, mon_x + EDGE_MARGIN, mon_x + mon_w - win_size.width - EDGE_MARGIN);
    let y = clamp(y, mon_y, mon_y + mon_h - win_size.height);

    window.set_position(LogicalPosition::new(x, y))
}

#[cfg(not(target_os = "macos"))]
fn position_popover<R: Runtime>(
    app: &AppHandle<R>,
    window: &WebviewWindow<R>,
    anchor: Option<Rect>,
) -> tauri::Result<()> {
    use tauri::PhysicalPosition;

    // Windows/Linux: トレイのあるモニター（不明ならプライマリ）の中央に表示
    let anchor = anchor.and_then(|r| anchor_physical_rect(app, &r));
    let monitor = anchor
        .and_then(|(x, y, w, h)| monitor_containing(app, x + w / 2.0, y + h / 2.0))
        .or_else(|| app.primary_monitor().ok().flatten());
    let Some(monitor) = monitor else {
        return Ok(());
    };

    let size = window.outer_size()?;
    let mon_pos = monitor.position();
    let mon_size = monitor.size();
    let x = mon_pos.x + (mon_size.width as i32 - size.width as i32) / 2;
    let y = mon_pos.y + (mon_size.height as i32 - size.height as i32) / 2;

    window.set_position(PhysicalPosition::new(x, y))
}

/// min > max の場合（ウィンドウがモニターより大きい）は min を優先
#[cfg(target_os = "macos")]
fn clamp(v: f64, min: f64, max: f64) -> f64 {
    v.min(max).max(min)
}
