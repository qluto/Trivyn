import Foundation

/// アプリの言語設定
@MainActor
enum AppLanguage: String, CaseIterable, Sendable {
    case system = "system"
    case english = "en"
    case japanese = "ja"

    /// 表示名（その言語自身での名称）
    var nativeName: String {
        switch self {
        case .system: return L10n.string("settings.language.system")
        case .english: return "English"
        case .japanese: return "日本語"
        }
    }

    /// 対応するロケール識別子（systemの場合はnil）
    var localeIdentifier: String? {
        switch self {
        case .system: return nil
        case .english: return "en"
        case .japanese: return "ja"
        }
    }
}

/// ローカライズヘルパー
@MainActor
enum L10n {
    /// 現在の言語設定に基づいてローカライズされた文字列を取得
    static func string(_ key: String) -> String {
        let bundle = AppSettings.shared.localizedBundle
        return bundle.localizedString(forKey: key, value: nil, table: nil)
    }

    /// フォーマット付きローカライズ文字列を取得
    static func string(_ key: String, _ arguments: CVarArg...) -> String {
        let format = string(key)
        return String(format: format, arguments: arguments)
    }
}

/// 曜日（日曜日=1 から 土曜日=7）
@MainActor
enum Weekday: Int, Codable, CaseIterable, Sendable {
    case sunday = 1
    case monday = 2
    case tuesday = 3
    case wednesday = 4
    case thursday = 5
    case friday = 6
    case saturday = 7

    var displayName: String {
        switch self {
        case .sunday: return L10n.string("weekday.sunday")
        case .monday: return L10n.string("weekday.monday")
        case .tuesday: return L10n.string("weekday.tuesday")
        case .wednesday: return L10n.string("weekday.wednesday")
        case .thursday: return L10n.string("weekday.thursday")
        case .friday: return L10n.string("weekday.friday")
        case .saturday: return L10n.string("weekday.saturday")
        }
    }

    var shortName: String {
        switch self {
        case .sunday: return L10n.string("weekday.short.sunday")
        case .monday: return L10n.string("weekday.short.monday")
        case .tuesday: return L10n.string("weekday.short.tuesday")
        case .wednesday: return L10n.string("weekday.short.wednesday")
        case .thursday: return L10n.string("weekday.short.thursday")
        case .friday: return L10n.string("weekday.short.friday")
        case .saturday: return L10n.string("weekday.short.saturday")
        }
    }
}

/// アプリ設定を管理するシングルトン
@MainActor
final class AppSettings: ObservableObject {
    static let shared = AppSettings()

    private let weekStartKey = "tria.settings.weekStart"
    private let languageKey = "tria.settings.language"

    /// 週の始まりの曜日
    @Published var weekStart: Weekday {
        didSet {
            UserDefaults.standard.set(weekStart.rawValue, forKey: weekStartKey)
            notifyWeekStartChanged()
        }
    }

    /// アプリの言語設定
    @Published var language: AppLanguage {
        didSet {
            UserDefaults.standard.set(language.rawValue, forKey: languageKey)
            _localizedBundle = nil // キャッシュをクリア
            notifyLanguageChanged()
        }
    }

    /// キャッシュされたローカライズバンドル
    private var _localizedBundle: Bundle?

    /// 現在の言語設定に基づいたバンドルを取得
    var localizedBundle: Bundle {
        if let cached = _localizedBundle {
            return cached
        }

        let bundle = resolveBundle()
        _localizedBundle = bundle
        return bundle
    }

    /// 設定を反映したCalendarを取得
    var calendar: Calendar {
        var cal = Calendar.current
        cal.firstWeekday = weekStart.rawValue
        return cal
    }

    /// 言語設定に基づいたLocaleを取得
    var locale: Locale {
        if let localeId = language.localeIdentifier {
            return Locale(identifier: localeId)
        }
        return Locale.current
    }

    private init() {
        // 週の始まりを読み込み
        let savedWeekStart = UserDefaults.standard.integer(forKey: weekStartKey)
        if let weekday = Weekday(rawValue: savedWeekStart) {
            self.weekStart = weekday
        } else {
            self.weekStart = .monday
        }

        // 言語設定を読み込み
        if let savedLanguage = UserDefaults.standard.string(forKey: languageKey),
           let lang = AppLanguage(rawValue: savedLanguage) {
            self.language = lang
        } else {
            self.language = .system
        }
    }

    /// 言語設定に基づいてバンドルを解決
    private func resolveBundle() -> Bundle {
        let targetLanguage: String

        if let localeId = language.localeIdentifier {
            targetLanguage = localeId
        } else {
            // システム設定の場合、優先言語を取得
            let preferredLanguages = Locale.preferredLanguages
            if let first = preferredLanguages.first {
                // "ja-JP" -> "ja" のように言語コードだけを取得
                targetLanguage = String(first.prefix(2))
            } else {
                targetLanguage = "en"
            }
        }

        // 対象言語のlprojパスを探す
        if let path = Bundle.module.path(forResource: targetLanguage, ofType: "lproj"),
           let bundle = Bundle(path: path) {
            return bundle
        }

        // 見つからない場合はデフォルト（英語）
        if let path = Bundle.module.path(forResource: "en", ofType: "lproj"),
           let bundle = Bundle(path: path) {
            return bundle
        }

        return Bundle.module
    }

    /// 週の始まり変更を通知
    private func notifyWeekStartChanged() {
        NotificationCenter.default.post(name: .weekStartDidChange, object: nil)
    }

    /// 言語変更を通知
    private func notifyLanguageChanged() {
        NotificationCenter.default.post(name: .languageDidChange, object: nil)
    }
}

// MARK: - Notifications

extension Notification.Name {
    static let weekStartDidChange = Notification.Name("tria.weekStartDidChange")
    static let languageDidChange = Notification.Name("tria.languageDidChange")
}
