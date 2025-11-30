import Foundation

/// 曜日（日曜日=1 から 土曜日=7）
enum Weekday: Int, Codable, CaseIterable {
    case sunday = 1
    case monday = 2
    case tuesday = 3
    case wednesday = 4
    case thursday = 5
    case friday = 6
    case saturday = 7

    var displayName: String {
        switch self {
        case .sunday: return "日曜日"
        case .monday: return "月曜日"
        case .tuesday: return "火曜日"
        case .wednesday: return "水曜日"
        case .thursday: return "木曜日"
        case .friday: return "金曜日"
        case .saturday: return "土曜日"
        }
    }

    var shortName: String {
        switch self {
        case .sunday: return "日"
        case .monday: return "月"
        case .tuesday: return "火"
        case .wednesday: return "水"
        case .thursday: return "木"
        case .friday: return "金"
        case .saturday: return "土"
        }
    }
}

/// アプリ設定を管理するシングルトン
@MainActor
final class AppSettings: ObservableObject {
    static let shared = AppSettings()

    private let weekStartKey = "tria.settings.weekStart"

    /// 週の始まりの曜日
    @Published var weekStart: Weekday {
        didSet {
            UserDefaults.standard.set(weekStart.rawValue, forKey: weekStartKey)
            notifyWeekStartChanged()
        }
    }

    /// 設定を反映したCalendarを取得
    var calendar: Calendar {
        var cal = Calendar.current
        cal.firstWeekday = weekStart.rawValue
        return cal
    }

    private init() {
        let savedValue = UserDefaults.standard.integer(forKey: weekStartKey)
        if let weekday = Weekday(rawValue: savedValue) {
            self.weekStart = weekday
        } else {
            // デフォルトは月曜日
            self.weekStart = .monday
        }
    }

    /// 週の始まり変更を通知
    private func notifyWeekStartChanged() {
        NotificationCenter.default.post(name: .weekStartDidChange, object: nil)
    }
}

// MARK: - Notifications

extension Notification.Name {
    static let weekStartDidChange = Notification.Name("tria.weekStartDidChange")
}
