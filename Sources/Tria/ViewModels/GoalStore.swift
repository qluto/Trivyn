import Foundation
import Combine

/// 目標の状態管理
@MainActor
final class GoalStore: ObservableObject {
    static let shared = GoalStore()

    @Published private(set) var goals: [Goal] = []
    @Published var selectedLevel: GoalLevel = .daily

    private let storageService: StorageService
    private var dayChangeObserver: NSObjectProtocol?

    init(storageService: StorageService = .shared) {
        self.storageService = storageService
        loadGoals()
        setupDayChangeObserver()
    }

    deinit {
        if let observer = dayChangeObserver {
            NotificationCenter.default.removeObserver(observer)
        }
    }

    // MARK: - Day Change Handling

    /// 日付変更の監視を設定
    private func setupDayChangeObserver() {
        dayChangeObserver = NotificationCenter.default.addObserver(
            forName: .NSCalendarDayChanged,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.handleDayChange()
            }
        }
    }

    /// 日付変更時の処理
    private func handleDayChange() {
        // Published プロパティを更新してUIをリフレッシュ
        objectWillChange.send()
        print("[Tria] Day changed - UI refreshed")
    }

    // MARK: - Computed Properties

    /// 現在の期間の日次目標
    var dailyGoals: [Goal] {
        goals.filter { $0.level == .daily && $0.isInPeriod(for: Date()) }
    }

    /// 現在の期間の週次目標
    var weeklyGoals: [Goal] {
        goals.filter { $0.level == .weekly && $0.isInPeriod(for: Date()) }
    }

    /// 現在の期間の月次目標
    var monthlyGoals: [Goal] {
        goals.filter { $0.level == .monthly && $0.isInPeriod(for: Date()) }
    }

    /// 選択中のレベルの目標
    var currentGoals: [Goal] {
        goals(for: selectedLevel)
    }

    /// 指定レベルの目標を取得
    func goals(for level: GoalLevel) -> [Goal] {
        switch level {
        case .daily: return dailyGoals
        case .weekly: return weeklyGoals
        case .monthly: return monthlyGoals
        }
    }

    /// 指定レベルで追加可能かどうか
    func canAddGoal(for level: GoalLevel) -> Bool {
        let currentCount: Int
        switch level {
        case .daily: currentCount = dailyGoals.count
        case .weekly: currentCount = weeklyGoals.count
        case .monthly: currentCount = monthlyGoals.count
        }
        return currentCount < level.maxGoals
    }

    // MARK: - History Queries

    /// 指定日の日次目標を取得
    func goalsForDay(_ date: Date) -> [Goal] {
        goals.filter { $0.level == .daily && $0.isInPeriod(for: date) }
    }

    /// 指定週の週次目標を取得
    func goalsForWeek(_ date: Date) -> [Goal] {
        goals.filter { $0.level == .weekly && $0.isInPeriod(for: date) }
    }

    /// 指定月の月次目標を取得
    func goalsForMonth(_ date: Date) -> [Goal] {
        goals.filter { $0.level == .monthly && $0.isInPeriod(for: date) }
    }

    // MARK: - Actions

    /// 新しい目標を追加
    func addGoal(title: String, level: GoalLevel, parentGoalId: UUID? = nil) {
        guard canAddGoal(for: level) else { return }

        let goal = Goal(
            title: title,
            level: level,
            periodStart: Date(),
            parentGoalId: parentGoalId
        )
        goals.append(goal)
        saveGoals()
    }

    /// 目標を達成済みにする
    func completeGoal(id: UUID) {
        guard let index = goals.firstIndex(where: { $0.id == id }) else {
            print("[Tria] Goal not found for completion: \(id)")
            return
        }
        goals[index].markAsCompleted()
        saveGoals()
        print("[Tria] Goal completed: \(goals[index].title)")
    }

    /// 目標を未達成に戻す
    func uncompleteGoal(id: UUID) {
        guard let index = goals.firstIndex(where: { $0.id == id }) else {
            print("[Tria] Goal not found for uncompletion: \(id)")
            return
        }
        goals[index].markAsIncomplete()
        saveGoals()
        print("[Tria] Goal uncompleted: \(goals[index].title)")
    }

    /// 目標の達成状態をトグル
    func toggleGoalCompletion(id: UUID) {
        guard let index = goals.firstIndex(where: { $0.id == id }) else {
            print("[Tria] Goal not found for toggle: \(id)")
            return
        }
        if goals[index].isCompleted {
            uncompleteGoal(id: id)
        } else {
            completeGoal(id: id)
        }
    }

    /// 目標の達成状態をトグル（Goal引数版 - 後方互換性）
    func toggleGoalCompletion(_ goal: Goal) {
        toggleGoalCompletion(id: goal.id)
    }

    /// 目標を更新
    func updateGoal(_ goal: Goal, title: String) {
        guard let index = goals.firstIndex(where: { $0.id == goal.id }) else { return }
        goals[index].title = title
        saveGoals()
    }

    /// 目標を削除
    func deleteGoal(_ goal: Goal) {
        goals.removeAll { $0.id == goal.id }
        saveGoals()
    }

    // MARK: - Persistence

    private func loadGoals() {
        goals = storageService.loadGoals()
    }

    private func saveGoals() {
        storageService.saveGoals(goals)
    }
}
