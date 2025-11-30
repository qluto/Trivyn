import Foundation
import UserNotifications

/// 週初め・月初めのリマインド機能を管理するサービス
@MainActor
final class ReminderService: ObservableObject {
    static let shared = ReminderService()

    private let storageService = StorageService.shared
    private let lastWeeklyReminderKey = "tria.lastWeeklyReminder"
    private let lastMonthlyReminderKey = "tria.lastMonthlyReminder"

    private var timer: Timer?
    private var notificationsEnabled = false

    init() {
        requestNotificationPermission()
        startPeriodicCheck()
    }

    deinit {
        timer?.invalidate()
    }

    // MARK: - Permission

    private func requestNotificationPermission() {
        // サンドボックス外では通知が使えない場合があるため、安全にチェック
        guard Bundle.main.bundleIdentifier != nil else {
            print("[Tria] No bundle identifier - notifications disabled")
            return
        }

        // 通知センターへのアクセスを遅延して行う
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            do {
                UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
                    DispatchQueue.main.async {
                        if let error = error {
                            print("[Tria] Notification permission error: \(error)")
                        } else {
                            self?.notificationsEnabled = granted
                            print("[Tria] Notification permission granted: \(granted)")
                        }
                    }
                }
            }
        }
    }

    // MARK: - Periodic Check

    private func startPeriodicCheck() {
        // 1時間ごとにチェック
        timer = Timer.scheduledTimer(withTimeInterval: 3600, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.checkAndNotify()
            }
        }
        // 起動時にもチェック
        checkAndNotify()
    }

    func checkAndNotify() {
        let now = Date()
        let calendar = Calendar.current

        // 週初め（月曜日）のチェック
        if calendar.component(.weekday, from: now) == 2 { // 2 = Monday
            checkWeeklyReminder(now: now, calendar: calendar)
        }

        // 月初めのチェック
        if calendar.component(.day, from: now) == 1 {
            checkMonthlyReminder(now: now, calendar: calendar)
        }

        // 週末（日曜日）の振り返りチェック
        if calendar.component(.weekday, from: now) == 1 { // 1 = Sunday
            checkWeeklyReflectionReminder(now: now, calendar: calendar)
        }

        // 月末の振り返りチェック
        if isLastDayOfMonth(date: now, calendar: calendar) {
            checkMonthlyReflectionReminder(now: now, calendar: calendar)
        }
    }

    // MARK: - Weekly Reminder

    private func checkWeeklyReminder(now: Date, calendar: Calendar) {
        let lastReminder = UserDefaults.standard.object(forKey: lastWeeklyReminderKey) as? Date

        // 今週すでに通知済みならスキップ
        if let last = lastReminder,
           calendar.isDate(last, equalTo: now, toGranularity: .weekOfYear) {
            return
        }

        let weeklyGoals = GoalStore.shared.weeklyGoals

        if weeklyGoals.isEmpty {
            // 週ゴールが設定されていない場合
            sendNotification(
                title: L10n.string("notification.weekly.setup.title"),
                body: L10n.string("notification.weekly.setup.body")
            )
        } else {
            // 週ゴールがある場合はリマインド
            let incompleteCount = weeklyGoals.filter { !$0.isCompleted }.count
            if incompleteCount > 0 {
                sendNotification(
                    title: L10n.string("notification.weekly.reminder.title"),
                    body: L10n.string("notification.weekly.reminder.body", incompleteCount)
                )
            }
        }

        UserDefaults.standard.set(now, forKey: lastWeeklyReminderKey)
    }

    // MARK: - Monthly Reminder

    private func checkMonthlyReminder(now: Date, calendar: Calendar) {
        let lastReminder = UserDefaults.standard.object(forKey: lastMonthlyReminderKey) as? Date

        // 今月すでに通知済みならスキップ
        if let last = lastReminder,
           calendar.isDate(last, equalTo: now, toGranularity: .month) {
            return
        }

        let monthlyGoals = GoalStore.shared.monthlyGoals

        if monthlyGoals.isEmpty {
            sendNotification(
                title: L10n.string("notification.monthly.setup.title"),
                body: L10n.string("notification.monthly.setup.body")
            )
        } else {
            let incompleteCount = monthlyGoals.filter { !$0.isCompleted }.count
            if incompleteCount > 0 {
                sendNotification(
                    title: L10n.string("notification.monthly.reminder.title"),
                    body: L10n.string("notification.monthly.reminder.body", incompleteCount)
                )
            }
        }

        UserDefaults.standard.set(now, forKey: lastMonthlyReminderKey)
    }

    // MARK: - Reflection Reminders

    private func checkWeeklyReflectionReminder(now: Date, calendar: Calendar) {
        let hour = calendar.component(.hour, from: now)

        // 日曜日の夕方（17-19時）に一度だけ通知
        guard hour >= 17 && hour <= 19 else { return }

        let lastReflection = UserDefaults.standard.object(forKey: "tria.lastWeeklyReflection") as? Date
        if let last = lastReflection,
           calendar.isDate(last, equalTo: now, toGranularity: .weekOfYear) {
            return
        }

        let weeklyGoals = GoalStore.shared.weeklyGoals
        let completedCount = weeklyGoals.filter { $0.isCompleted }.count

        sendNotification(
            title: L10n.string("notification.weekly.reflection.title"),
            body: completedCount == weeklyGoals.count && !weeklyGoals.isEmpty
                ? L10n.string("notification.weekly.reflection.complete")
                : L10n.string("notification.weekly.reflection.prompt")
        )

        UserDefaults.standard.set(now, forKey: "tria.lastWeeklyReflection")
    }

    private func checkMonthlyReflectionReminder(now: Date, calendar: Calendar) {
        let hour = calendar.component(.hour, from: now)

        // 月末の夕方（17-19時）に一度だけ通知
        guard hour >= 17 && hour <= 19 else { return }

        let lastReflection = UserDefaults.standard.object(forKey: "tria.lastMonthlyReflection") as? Date
        if let last = lastReflection,
           calendar.isDate(last, equalTo: now, toGranularity: .month) {
            return
        }

        let monthlyGoals = GoalStore.shared.monthlyGoals
        let completedCount = monthlyGoals.filter { $0.isCompleted }.count

        sendNotification(
            title: L10n.string("notification.monthly.reflection.title"),
            body: completedCount == monthlyGoals.count && !monthlyGoals.isEmpty
                ? L10n.string("notification.monthly.reflection.complete")
                : L10n.string("notification.monthly.reflection.prompt")
        )

        UserDefaults.standard.set(now, forKey: "tria.lastMonthlyReflection")
    }

    // MARK: - Helpers

    private func isLastDayOfMonth(date: Date, calendar: Calendar) -> Bool {
        let day = calendar.component(.day, from: date)
        guard let range = calendar.range(of: .day, in: .month, for: date) else { return false }
        return day == range.count
    }

    private func sendNotification(title: String, body: String) {
        guard notificationsEnabled else {
            print("[Tria] Notification (disabled): \(title) - \(body)")
            return
        }

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil // 即座に通知
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("[Tria] Failed to send notification: \(error)")
            }
        }
    }

    // MARK: - Manual Trigger (for testing)

    func triggerWeeklyReminder() {
        sendNotification(
            title: L10n.string("notification.weekly.check.title"),
            body: L10n.string("notification.weekly.check.body")
        )
    }

    func triggerMonthlyReminder() {
        sendNotification(
            title: L10n.string("notification.monthly.check.title"),
            body: L10n.string("notification.monthly.check.body")
        )
    }
}
