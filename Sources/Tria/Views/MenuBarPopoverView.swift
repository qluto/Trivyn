import SwiftUI

/// メニューバーポップオーバーのメインビュー
struct MenuBarPopoverView: View {
    @EnvironmentObject var goalStore: GoalStore
    @State private var newGoalTitle = ""
    @State private var showingConfetti = false
    @State private var confettiGoalId: UUID?

    var body: some View {
        VStack(spacing: 0) {
            // ヘッダー（ロゴ + 全レベルの進捗）
            header

            Divider()

            // 目標リスト（メインコンテンツ）
            ScrollView {
                LazyVStack(spacing: 6) {
                    ForEach(goalStore.currentGoals) { goal in
                        let goalId = goal.id
                        let wasCompleted = goal.isCompleted
                        GoalRowView(
                            goal: goal,
                            accentColor: goalStore.selectedLevel.accentColor,
                            onToggle: {
                                if !wasCompleted {
                                    confettiGoalId = goalId
                                    showingConfetti = true
                                }
                                goalStore.toggleGoalCompletion(id: goalId)
                            },
                            onDelete: {
                                goalStore.deleteGoal(goal)
                            }
                        )
                    }

                    // 新しい目標を追加
                    if goalStore.canAddGoal(for: goalStore.selectedLevel) {
                        addGoalField
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
            }

            Divider()

            // フッター
            footer
        }
        .frame(width: 300, height: 340)
        .overlay {
            if showingConfetti {
                ConfettiView()
                    .allowsHitTesting(false)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                            showingConfetti = false
                            confettiGoalId = nil
                        }
                    }
            }
        }
    }

    private var header: some View {
        HStack {
            Text("Tria")
                .font(.system(size: 18, weight: .bold, design: .rounded))

            Spacer()

            // 全レベルの進捗を表示（タップでレベル切り替え）
            HStack(spacing: 10) {
                ForEach(GoalLevel.allCases, id: \.self) { level in
                    LevelProgressIndicator(
                        level: level,
                        goals: goalStore.goals(for: level),
                        isSelected: goalStore.selectedLevel == level
                    )
                    .onTapGesture {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            goalStore.selectedLevel = level
                        }
                    }
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private var addGoalField: some View {
        HStack(spacing: 8) {
            Image(systemName: "plus.circle")
                .font(.system(size: 14))
                .foregroundColor(goalStore.selectedLevel.accentColor.opacity(0.6))

            TextField("新しい目標を追加...", text: $newGoalTitle)
                .textFieldStyle(.plain)
                .font(.system(size: 13))
                .onSubmit {
                    addNewGoal()
                }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.secondary.opacity(0.08))
        .cornerRadius(8)
    }

    private var footer: some View {
        HStack {
            Button(action: { FloatingWindowController.shared.showWindow() }) {
                HStack(spacing: 4) {
                    Image(systemName: "macwindow.on.rectangle")
                        .font(.system(size: 12))
                    Text("フローティング")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                }
            }
            .buttonStyle(.borderless)
            .foregroundColor(.secondary)

            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
    }

    private func addNewGoal() {
        let title = newGoalTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }

        goalStore.addGoal(title: title, level: goalStore.selectedLevel)
        newGoalTitle = ""
    }
}

/// レベルごとの進捗インジケーター
struct LevelProgressIndicator: View {
    let level: GoalLevel
    let goals: [Goal]
    let isSelected: Bool

    private var completedCount: Int {
        goals.filter { $0.isCompleted }.count
    }

    var body: some View {
        VStack(spacing: 3) {
            // 進捗ドット（3つ）
            HStack(spacing: 3) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(i < completedCount ? level.accentColor : Color.secondary.opacity(0.2))
                        .frame(width: 6, height: 6)
                }
            }

            // レベル名
            Text(level.displayName)
                .font(.system(size: 9, weight: isSelected ? .semibold : .regular, design: .rounded))
                .foregroundColor(isSelected ? level.accentColor : .secondary.opacity(0.6))
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 4)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(isSelected ? level.accentColor.opacity(0.1) : Color.clear)
        )
        .contentShape(Rectangle())
    }
}
