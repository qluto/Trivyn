import SwiftUI

/// 振り返りの種類
enum ReflectionType {
    case weekly
    case monthly

    var title: String {
        switch self {
        case .weekly: return "今週の振り返り"
        case .monthly: return "今月の振り返り"
        }
    }

    var level: GoalLevel {
        switch self {
        case .weekly: return .weekly
        case .monthly: return .monthly
        }
    }

    var accentColor: Color {
        level.accentColor
    }

    var storageKey: String {
        switch self {
        case .weekly: return "tria.reflection.weekly"
        case .monthly: return "tria.reflection.monthly"
        }
    }
}

/// 週・月の振り返り画面
struct ReflectionView: View {
    @EnvironmentObject var goalStore: GoalStore
    @Binding var isPresented: Bool
    let type: ReflectionType

    @State private var reflectionPoints: [String] = ["", "", ""]
    @State private var showingConfetti = false

    private var currentGoals: [Goal] {
        switch type {
        case .weekly: return goalStore.weeklyGoals
        case .monthly: return goalStore.monthlyGoals
        }
    }

    private var completedCount: Int {
        currentGoals.filter { $0.isCompleted }.count
    }

    private var completionRate: Double {
        guard !currentGoals.isEmpty else { return 0 }
        return Double(completedCount) / Double(currentGoals.count)
    }

    var body: some View {
        VStack(spacing: 0) {
            // ヘッダー
            header

            Divider()

            // メインコンテンツ
            VStack(spacing: 14) {
                // 達成度サマリー
                achievementSummary

                // 今期のゴール一覧
                if !currentGoals.isEmpty {
                    currentGoalsSection
                }

                Divider()

                // 振り返りポイント
                reflectionPointsSection
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            Divider()

            // フッター
            footer
        }
        .frame(width: 320)
        .fixedSize(horizontal: false, vertical: true)
        .overlay {
            if showingConfetti {
                ConfettiView(originPoint: nil)
                    .allowsHitTesting(false)
            }
        }
        .onAppear {
            loadReflectionPoints()
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Button(action: { isPresented = false }) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)

            Spacer()

            Text(type.title)
                .font(.system(size: 16, weight: .bold, design: .rounded))

            Spacer()

            // バランス用の透明なスペース
            Color.clear.frame(width: 20, height: 20)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    // MARK: - Achievement Summary

    private var achievementSummary: some View {
        VStack(spacing: 12) {
            // 達成率リング
            ZStack {
                Circle()
                    .stroke(Color.secondary.opacity(0.1), lineWidth: 8)
                    .frame(width: 80, height: 80)

                Circle()
                    .trim(from: 0, to: completionRate)
                    .stroke(type.accentColor, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .frame(width: 80, height: 80)
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 2) {
                    Text("\(completedCount)/\(currentGoals.count)")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                    Text("達成")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
            }

            // 励ましメッセージ
            Text(encouragementMessage)
                .font(.system(size: 13))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 8)
    }

    private var encouragementMessage: String {
        if currentGoals.isEmpty {
            return "ゴールが設定されていませんでした"
        }
        switch completionRate {
        case 1.0:
            return "すべて達成しました！"
        case 0.67...:
            return "よく頑張りました！"
        case 0.34...:
            return "着実に進んでいます"
        default:
            return "振り返って次に活かしましょう"
        }
    }

    // MARK: - Current Goals Section

    private var currentGoalsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(type == .weekly ? "今週のゴール" : "今月のゴール")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.secondary)

            ForEach(currentGoals) { goal in
                HStack(spacing: 8) {
                    Image(systemName: goal.isCompleted ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 14))
                        .foregroundColor(goal.isCompleted ? type.accentColor : .secondary.opacity(0.3))

                    Text(goal.title)
                        .font(.system(size: 13))
                        .foregroundColor(goal.isCompleted ? .primary : .secondary)
                        .strikethrough(goal.isCompleted, color: .secondary.opacity(0.3))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Reflection Points Section

    private var reflectionPointsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 4) {
                Image(systemName: "lightbulb")
                    .font(.system(size: 11))
                Text("気づき・学び")
                    .font(.system(size: 12, weight: .semibold))
            }
            .foregroundColor(type.accentColor)

            ForEach(0..<3, id: \.self) { index in
                HStack(alignment: .top, spacing: 8) {
                    Text("•")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(type.accentColor.opacity(0.5))
                        .frame(width: 12)

                    TextField("振り返りポイント...", text: $reflectionPoints[index], axis: .vertical)
                        .textFieldStyle(.plain)
                        .font(.system(size: 13))
                        .lineLimit(2...4)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.secondary.opacity(0.06))
                        .cornerRadius(6)
                }
            }

            // ヒント
            Text("うまくいったこと、改善点、次に活かせることなど")
                .font(.system(size: 10))
                .foregroundColor(.secondary.opacity(0.5))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Footer

    private var footer: some View {
        HStack {
            Button("閉じる") {
                isPresented = false
            }
            .buttonStyle(.plain)
            .foregroundColor(.secondary)
            .font(.system(size: 13))

            Spacer()

            Button(action: saveAndClose) {
                Text("保存")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 8)
                    .background(hasReflectionPoints ? type.accentColor : Color.secondary.opacity(0.3))
                    .cornerRadius(8)
            }
            .buttonStyle(.plain)
            .disabled(!hasReflectionPoints)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private var hasReflectionPoints: Bool {
        reflectionPoints.contains { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
    }

    // MARK: - Persistence

    private func loadReflectionPoints() {
        let key = reflectionKeyForCurrentPeriod()
        if let saved = UserDefaults.standard.stringArray(forKey: key) {
            reflectionPoints = saved + Array(repeating: "", count: max(0, 3 - saved.count))
        }
    }

    private func saveAndClose() {
        let key = reflectionKeyForCurrentPeriod()
        let nonEmpty = reflectionPoints.filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        UserDefaults.standard.set(nonEmpty, forKey: key)

        // 紙吹雪を表示してから閉じる
        showingConfetti = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            isPresented = false
        }
    }

    private func reflectionKeyForCurrentPeriod() -> String {
        let calendar = Calendar.current
        let now = Date()

        switch type {
        case .weekly:
            let weekOfYear = calendar.component(.weekOfYear, from: now)
            let year = calendar.component(.yearForWeekOfYear, from: now)
            return "\(type.storageKey).\(year).\(weekOfYear)"
        case .monthly:
            let month = calendar.component(.month, from: now)
            let year = calendar.component(.year, from: now)
            return "\(type.storageKey).\(year).\(month)"
        }
    }
}
