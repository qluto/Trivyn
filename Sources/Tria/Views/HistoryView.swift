import SwiftUI

/// カレンダー型の履歴ビュー
struct HistoryView: View {
    @EnvironmentObject var goalStore: GoalStore
    @Binding var isPresented: Bool
    @State private var displayedMonth: Date = Date()
    @State private var selection: Selection? = nil

    private let calendar = Calendar.current
    private var weekdays: [String] {
        Weekday.allCases.map { $0.shortName }
    }

    enum Selection: Equatable {
        case day(Date)
        case week(Date)
        case month(Date)
    }

    var body: some View {
        VStack(spacing: 0) {
            // ヘッダー
            HStack {
                Button(action: { isPresented = false }) {
                    HStack(spacing: 2) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 11, weight: .medium))
                        Text(L10n.string("history.back"))
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                    }
                }
                .buttonStyle(.plain)
                .foregroundColor(.secondary)

                Spacer()

                Text(L10n.string("history.title"))
                    .font(.system(size: 14, weight: .bold, design: .rounded))

                Spacer()

                // バランス用
                HStack(spacing: 2) {
                    Image(systemName: "chevron.left")
                    Text("history.back")
                }
                .font(.system(size: 11))
                .opacity(0)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 4)

            Divider()

            // 月ナビゲーション + 月の目標
            HStack(spacing: 0) {
                // 月の目標ドット
                monthGoalsDots
                    .frame(width: 20, alignment: .leading)

                // 月ナビゲーション
                Button(action: { changeMonth(by: -1) }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 10))
                        .frame(width: 22, height: 22)
                }
                .buttonStyle(.plain)
                .foregroundColor(.secondary)

                Spacer()

                Text(monthYearString(displayedMonth))
                    .font(.system(size: 12, weight: .semibold, design: .rounded))

                Spacer()

                Button(action: { changeMonth(by: 1) }) {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 10))
                        .frame(width: 22, height: 22)
                }
                .buttonStyle(.plain)
                .foregroundColor(.secondary)

                Color.clear.frame(width: 20)
            }
            .padding(.horizontal, 6)
            .padding(.vertical, 2)

            // 曜日ヘッダー
            HStack(spacing: 0) {
                Color.clear.frame(width: 22)

                ForEach(weekdays, id: \.self) { day in
                    Text(day)
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal, 6)

            // カレンダーグリッド
            VStack(spacing: 0) {
                ForEach(weeksInMonth(), id: \.self) { week in
                    HStack(spacing: 0) {
                        // 週の目標ドット
                        weekGoalsDots(for: week)

                        // 日付セル
                        ForEach(0..<7, id: \.self) { dayIndex in
                            if let date = week[dayIndex] {
                                dayCellView(date: date)
                            } else {
                                Color.clear
                                    .frame(maxWidth: .infinity, minHeight: 26)
                            }
                        }
                    }
                    .padding(.horizontal, 6)
                }
            }

            // 選択された項目の詳細
            if let selection = selection {
                Divider()
                    .padding(.top, 2)
                selectionDetailView(selection)
            }
        }
        .frame(width: 300)
        .fixedSize(horizontal: false, vertical: true)
    }

    // MARK: - Month Goals Dots

    private var monthGoalsDots: some View {
        let monthlyGoals = goalStore.goalsForMonth(displayedMonth)
        let completedCount = monthlyGoals.filter { $0.isCompleted }.count
        let totalCount = monthlyGoals.count
        let isSelected: Bool = {
            if case .month(let date) = selection {
                return calendar.isDate(date, equalTo: displayedMonth, toGranularity: .month)
            }
            return false
        }()

        return Button(action: { selection = .month(displayedMonth) }) {
            HStack(spacing: 2) {
                if totalCount > 0 {
                    ForEach(0..<min(totalCount, 3), id: \.self) { i in
                        Circle()
                            .fill(i < completedCount ? GoalLevel.monthly.accentColor : Color.secondary.opacity(0.3))
                            .frame(width: 4, height: 4)
                    }
                } else {
                    Text("-")
                        .font(.system(size: 8))
                        .foregroundColor(.secondary.opacity(0.3))
                }
            }
            .frame(height: 22)
            .padding(.horizontal, 4)
            .contentShape(Rectangle())
            .background(
                RoundedRectangle(cornerRadius: 4)
                    .fill(isSelected ? GoalLevel.monthly.accentColor.opacity(0.15) : Color.clear)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Week Goals Dots

    private func weekGoalsDots(for week: [Date?]) -> some View {
        let weekStart = week.compactMap { $0 }.first
        let weeklyGoals = weekStart.map { goalStore.goalsForWeek($0) } ?? []
        let completedCount = weeklyGoals.filter { $0.isCompleted }.count
        let totalCount = weeklyGoals.count
        let isSelected: Bool = {
            guard let weekStart = weekStart, case .week(let date) = selection else { return false }
            return calendar.isDate(date, equalTo: weekStart, toGranularity: .weekOfYear)
        }()

        return Button(action: {
            if let weekStart = weekStart {
                selection = .week(weekStart)
            }
        }) {
            HStack(spacing: 2) {
                if totalCount > 0 {
                    ForEach(0..<min(totalCount, 3), id: \.self) { i in
                        Circle()
                            .fill(i < completedCount ? GoalLevel.weekly.accentColor : Color.secondary.opacity(0.3))
                            .frame(width: 4, height: 4)
                    }
                } else {
                    Text("-")
                        .font(.system(size: 8))
                        .foregroundColor(.secondary.opacity(0.3))
                }
            }
            .frame(width: 22, height: 26)
            .contentShape(Rectangle())
            .background(
                RoundedRectangle(cornerRadius: 4)
                    .fill(isSelected ? GoalLevel.weekly.accentColor.opacity(0.15) : Color.clear)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Day Cell

    private func dayCellView(date: Date) -> some View {
        let dailyGoals = goalStore.goalsForDay(date)
        let completedCount = dailyGoals.filter { $0.isCompleted }.count
        let totalCount = dailyGoals.count
        let isToday = calendar.isDateInToday(date)
        let isSelected: Bool = {
            if case .day(let selectedDate) = selection {
                return calendar.isDate(selectedDate, inSameDayAs: date)
            }
            return false
        }()

        return Button(action: { selection = .day(date) }) {
            VStack(spacing: 2) {
                Text("\(calendar.component(.day, from: date))")
                    .font(.system(size: 10, weight: isToday ? .bold : .regular, design: .rounded))
                    .foregroundColor(isToday ? GoalLevel.daily.accentColor : .primary.opacity(0.8))

                if totalCount > 0 {
                    HStack(spacing: 1) {
                        ForEach(0..<min(totalCount, 3), id: \.self) { i in
                            Circle()
                                .fill(i < completedCount ? GoalLevel.daily.accentColor : Color.secondary.opacity(0.2))
                                .frame(width: 3, height: 3)
                        }
                    }
                } else {
                    Color.clear.frame(height: 3)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 26)
            .background(
                RoundedRectangle(cornerRadius: 4)
                    .fill(isSelected ? GoalLevel.daily.accentColor.opacity(0.15) :
                          (isToday ? GoalLevel.daily.accentColor.opacity(0.06) : Color.clear))
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Selection Detail View

    @ViewBuilder
    private func selectionDetailView(_ selection: Selection) -> some View {
        switch selection {
        case .day(let date):
            dayDetailView(date: date)
        case .week(let date):
            weekDetailView(date: date)
        case .month(let date):
            monthDetailView(date: date)
        }
    }

    private func dayDetailView(date: Date) -> some View {
        let goals = goalStore.goalsForDay(date)
        return goalDetailContent(
            title: dateString(date),
            goals: goals,
            emptyMessage: L10n.string("history.empty.day"),
            accentColor: GoalLevel.daily.accentColor
        )
    }

    private func weekDetailView(date: Date) -> some View {
        let goals = goalStore.goalsForWeek(date)
        let reflectionPoints = getWeeklyReflectionPoints(for: date)
        return goalDetailContent(
            title: weekString(date),
            goals: goals,
            emptyMessage: String(localized: "history.empty.week"),
            accentColor: GoalLevel.weekly.accentColor,
            reflectionPoints: reflectionPoints
        )
    }

    private func monthDetailView(date: Date) -> some View {
        let goals = goalStore.goalsForMonth(date)
        let reflectionPoints = getMonthlyReflectionPoints(for: date)
        return goalDetailContent(
            title: monthString(date),
            goals: goals,
            emptyMessage: L10n.string("history.empty.month"),
            accentColor: GoalLevel.monthly.accentColor,
            reflectionPoints: reflectionPoints
        )
    }

    private func goalDetailContent(title: String, goals: [Goal], emptyMessage: String, accentColor: Color, reflectionPoints: [String] = []) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundColor(accentColor)

            if goals.isEmpty {
                Text(emptyMessage)
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            } else {
                ForEach(goals) { goal in
                    HStack(spacing: 4) {
                        Circle()
                            .fill(goal.isCompleted ? accentColor : Color.secondary.opacity(0.3))
                            .frame(width: 5, height: 5)
                        Text(goal.title)
                            .font(.system(size: 10))
                            .foregroundColor(goal.isCompleted ? .secondary : .primary)
                            .strikethrough(goal.isCompleted)
                    }
                }
            }

            // 振り返りポイントがあれば表示
            if !reflectionPoints.isEmpty {
                Divider()
                    .padding(.vertical, 2)

                HStack(spacing: 3) {
                    Image(systemName: "lightbulb")
                        .font(.system(size: 9))
                    Text(L10n.string("history.insights"))
                        .font(.system(size: 10, weight: .medium))
                }
                .foregroundColor(accentColor.opacity(0.8))

                ForEach(reflectionPoints, id: \.self) { point in
                    HStack(alignment: .top, spacing: 4) {
                        Text("•")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(accentColor.opacity(0.5))
                        Text(point)
                            .font(.system(size: 10))
                            .foregroundColor(.primary.opacity(0.8))
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
    }

    // MARK: - Reflection Points

    private func getWeeklyReflectionPoints(for date: Date) -> [String] {
        let weekOfYear = calendar.component(.weekOfYear, from: date)
        let year = calendar.component(.yearForWeekOfYear, from: date)
        let key = "tria.reflection.weekly.\(year).\(weekOfYear)"
        return UserDefaults.standard.stringArray(forKey: key) ?? []
    }

    private func getMonthlyReflectionPoints(for date: Date) -> [String] {
        let month = calendar.component(.month, from: date)
        let year = calendar.component(.year, from: date)
        let key = "tria.reflection.monthly.\(year).\(month)"
        return UserDefaults.standard.stringArray(forKey: key) ?? []
    }

    // MARK: - Helpers

    private func changeMonth(by value: Int) {
        if let newMonth = calendar.date(byAdding: .month, value: value, to: displayedMonth) {
            displayedMonth = newMonth
            selection = nil
        }
    }

    private func weeksInMonth() -> [[Date?]] {
        var cal = Calendar.current
        cal.firstWeekday = 1 // 日曜始まり

        guard let monthRange = cal.range(of: .day, in: .month, for: displayedMonth),
              let firstOfMonth = cal.date(from: cal.dateComponents([.year, .month], from: displayedMonth)) else {
            return []
        }

        let firstWeekday = cal.component(.weekday, from: firstOfMonth)
        var weeks: [[Date?]] = []
        var currentWeek: [Date?] = Array(repeating: nil, count: firstWeekday - 1)

        for day in monthRange {
            if let date = cal.date(byAdding: .day, value: day - 1, to: firstOfMonth) {
                currentWeek.append(date)
                if currentWeek.count == 7 {
                    weeks.append(currentWeek)
                    currentWeek = []
                }
            }
        }

        if !currentWeek.isEmpty {
            while currentWeek.count < 7 {
                currentWeek.append(nil)
            }
            weeks.append(currentWeek)
        }

        return weeks
    }

    private func monthYearString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = AppSettings.shared.locale
        formatter.setLocalizedDateFormatFromTemplate("yyyy MMMM")
        return formatter.string(from: date)
    }

    private func dateString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = AppSettings.shared.locale
        formatter.setLocalizedDateFormatFromTemplate("MMMd EEEE")
        return formatter.string(from: date)
    }

    private func weekString(_ date: Date) -> String {
        let weekOfYear = calendar.component(.weekOfYear, from: date)
        let formatter = DateFormatter()
        formatter.locale = AppSettings.shared.locale
        formatter.setLocalizedDateFormatFromTemplate("MMMM")
        return "\(formatter.string(from: date)) W\(weekOfYear)"
    }

    private func monthString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = AppSettings.shared.locale
        formatter.setLocalizedDateFormatFromTemplate("yyyy MMMM")
        return formatter.string(from: date)
    }
}
