import Foundation
import SwiftUI

/// 目標のレベル（日次/週次/月次）
enum GoalLevel: String, Codable, CaseIterable {
    case daily = "daily"
    case weekly = "weekly"
    case monthly = "monthly"

    var displayName: String {
        switch self {
        case .daily: return "今日"
        case .weekly: return "今週"
        case .monthly: return "今月"
        }
    }

    var maxGoals: Int { 3 }

    /// レベルごとのアクセントカラー
    var accentColor: Color {
        switch self {
        case .daily:   return Color(hue: 0.08, saturation: 0.75, brightness: 0.95)  // オレンジ - 今日の緊急感
        case .weekly:  return Color(hue: 0.75, saturation: 0.55, brightness: 0.85)  // 紫 - 計画的
        case .monthly: return Color(hue: 0.48, saturation: 0.60, brightness: 0.75)  // ティール - 長期的視野
        }
    }
}

/// 目標モデル
struct Goal: Identifiable, Codable {
    let id: UUID
    var title: String
    var level: GoalLevel
    var isCompleted: Bool
    var completedAt: Date?
    var createdAt: Date
    var periodStart: Date
    var parentGoalId: UUID?  // 上位目標との紐づけ（任意）
    var note: String?

    init(
        id: UUID = UUID(),
        title: String,
        level: GoalLevel,
        isCompleted: Bool = false,
        completedAt: Date? = nil,
        createdAt: Date = Date(),
        periodStart: Date = Date(),
        parentGoalId: UUID? = nil,
        note: String? = nil
    ) {
        self.id = id
        self.title = title
        self.level = level
        self.isCompleted = isCompleted
        self.completedAt = completedAt
        self.createdAt = createdAt
        self.periodStart = periodStart
        self.parentGoalId = parentGoalId
        self.note = note
    }

    /// 目標を達成済みにする
    mutating func markAsCompleted() {
        isCompleted = true
        completedAt = Date()
    }

    /// 目標を未達成に戻す
    mutating func markAsIncomplete() {
        isCompleted = false
        completedAt = nil
    }
}

// MARK: - Period Helpers

extension Goal {
    /// 指定された日付がこの目標の期間内かどうか
    func isInPeriod(for date: Date) -> Bool {
        let calendar = Calendar.current

        switch level {
        case .daily:
            return calendar.isDate(periodStart, inSameDayAs: date)
        case .weekly:
            guard let weekStart = calendar.dateInterval(of: .weekOfYear, for: periodStart)?.start,
                  let targetWeekStart = calendar.dateInterval(of: .weekOfYear, for: date)?.start else {
                return false
            }
            return weekStart == targetWeekStart
        case .monthly:
            let periodComponents = calendar.dateComponents([.year, .month], from: periodStart)
            let dateComponents = calendar.dateComponents([.year, .month], from: date)
            return periodComponents.year == dateComponents.year &&
                   periodComponents.month == dateComponents.month
        }
    }
}
