import { create } from 'zustand';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

type UpdateStatus = 'idle' | 'available' | 'installing' | 'error';

interface UpdateState {
  status: UpdateStatus;
  version: string | null;
  checkForUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

// Update オブジェクトはシリアライズ不可のためストア外に保持する
let pendingUpdate: Update | null = null;

export const useUpdateStore = create<UpdateState>((set, get) => ({
  status: 'idle',
  version: null,

  checkForUpdate: async () => {
    // dev ではリリースビルドのみ有効なアップデーターを起動しない
    if (!import.meta.env.PROD) return;
    // インストール中・エラー表示中は状態を上書きしない
    if (get().status !== 'idle') return;

    try {
      const update = await check();
      if (update) {
        pendingUpdate = update;
        set({ status: 'available', version: update.version });
      }
    } catch (error) {
      // オフライン等での失敗は次回チェックに任せて静かに握りつぶす
      console.warn('[updateStore] Update check failed:', error);
    }
  },

  installUpdate: async () => {
    if (!pendingUpdate) return;

    set({ status: 'installing' });
    try {
      await pendingUpdate.downloadAndInstall();
      // Windows ではインストーラー起動時にアプリが自動終了するためここには到達しない
      await relaunch();
    } catch (error) {
      console.error('[updateStore] Update install failed:', error);
      set({ status: 'error' });
    }
  },
}));
