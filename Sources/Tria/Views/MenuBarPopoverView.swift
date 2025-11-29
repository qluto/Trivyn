import SwiftUI

/// メニューバーポップオーバーのメインビュー
struct MenuBarPopoverView: View {
    @EnvironmentObject var goalStore: GoalStore
    @State private var newGoalTitle = ""
    @State private var showingConfetti = false
    @State private var confettiGoalId: UUID?

    var body: some View {
        VStack(spacing: 0) {
            // ヘッダー
            header

            Divider()

            // タブセレクター
            levelPicker

            // 目標リスト
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(goalStore.currentGoals) { goal in
                        let goalId = goal.id
                        let wasCompleted = goal.isCompleted
                        GoalRowView(
                            goal: goal,
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
                .padding()
            }

            Divider()

            // フッター
            footer
        }
        .frame(width: 320, height: 400)
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
            Image(systemName: "triangle.fill")
                .foregroundColor(.accentColor)
            Text("Tria")
                .font(.headline)
            Spacer()
        }
        .padding()
    }

    private var levelPicker: some View {
        Picker("", selection: $goalStore.selectedLevel) {
            ForEach(GoalLevel.allCases, id: \.self) { level in
                Text(level.displayName).tag(level)
            }
        }
        .pickerStyle(.segmented)
        .padding(.horizontal)
        .padding(.vertical, 8)
    }

    private var addGoalField: some View {
        HStack {
            Image(systemName: "plus.circle")
                .foregroundColor(.secondary)

            TextField("新しい目標を追加...", text: $newGoalTitle)
                .textFieldStyle(.plain)
                .onSubmit {
                    addNewGoal()
                }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(8)
    }

    private var footer: some View {
        HStack {
            Button(action: { FloatingWindowController.shared.showWindow() }) {
                Image(systemName: "macwindow.on.rectangle")
                Text("フローティング")
            }
            .buttonStyle(.borderless)

            Spacer()

            Text("\(completedCount)/\(totalCount)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
    }

    private var completedCount: Int {
        goalStore.currentGoals.filter { $0.isCompleted }.count
    }

    private var totalCount: Int {
        goalStore.currentGoals.count
    }

    private func addNewGoal() {
        let title = newGoalTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }

        goalStore.addGoal(title: title, level: goalStore.selectedLevel)
        newGoalTitle = ""
    }
}
