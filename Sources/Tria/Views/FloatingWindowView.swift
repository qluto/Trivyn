import SwiftUI

/// ミニマルなフローティングウィンドウのビュー
struct FloatingWindowView: View {
    @EnvironmentObject var goalStore: GoalStore
    @State private var newGoalTitle = ""
    @State private var showingConfetti = false
    @State private var isHovered = false

    var body: some View {
        VStack(spacing: 0) {
            // ミニマルなヘッダー（ドラッグエリア）
            header

            // 目標リスト
            ScrollView {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(goalStore.dailyGoals) { goal in
                        let goalId = goal.id
                        let wasCompleted = goal.isCompleted
                        MinimalGoalRow(
                            goal: goal,
                            onToggle: {
                                if !wasCompleted {
                                    showingConfetti = true
                                }
                                goalStore.toggleGoalCompletion(id: goalId)
                            }
                        )
                    }

                    // 新しい目標を追加
                    if goalStore.canAddGoal(for: .daily) {
                        addGoalField
                    }

                    // 空の状態
                    if goalStore.dailyGoals.isEmpty {
                        emptyState
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
            }
        }
        .frame(width: 260, height: 300)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.15), radius: 12, x: 0, y: 4)
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(Color.primary.opacity(0.06), lineWidth: 0.5)
        )
        .overlay {
            if showingConfetti {
                ConfettiView()
                    .allowsHitTesting(false)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                            showingConfetti = false
                        }
                    }
            }
        }
        .onHover { hovering in
            isHovered = hovering
        }
    }

    private var header: some View {
        HStack(spacing: 6) {
            // アプリアイコン（小さな三角形）
            Image(systemName: "triangle.fill")
                .font(.system(size: 10))
                .foregroundColor(.accentColor)

            Text("今日の3つ")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.primary.opacity(0.8))

            Spacer()

            // 進捗インジケーター
            ProgressDots(completed: completedCount, total: 3)

            // 閉じるボタン（ホバー時のみ）
            if isHovered {
                Button(action: { FloatingWindowController.shared.hideWindow() }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
                .transition(.opacity)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.primary.opacity(0.03))
    }

    private var addGoalField: some View {
        HStack(spacing: 6) {
            Circle()
                .strokeBorder(Color.secondary.opacity(0.3), lineWidth: 1)
                .frame(width: 16, height: 16)

            TextField("追加...", text: $newGoalTitle)
                .textFieldStyle(.plain)
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .onSubmit {
                    addNewGoal()
                }
        }
        .padding(.vertical, 4)
    }

    private var emptyState: some View {
        VStack(spacing: 6) {
            Image(systemName: "triangle")
                .font(.system(size: 24))
                .foregroundColor(.secondary.opacity(0.4))

            Text("今日達成したい3つを追加")
                .font(.system(size: 11))
                .foregroundColor(.secondary.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
    }

    private var completedCount: Int {
        goalStore.dailyGoals.filter { $0.isCompleted }.count
    }

    private func addNewGoal() {
        let title = newGoalTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }

        goalStore.addGoal(title: title, level: .daily)
        newGoalTitle = ""
    }
}

/// ミニマルな目標行
struct MinimalGoalRow: View {
    let goal: Goal
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            // チェックサークル
            Button(action: onToggle) {
                ZStack {
                    Circle()
                        .strokeBorder(
                            goal.isCompleted ? Color.accentColor : Color.secondary.opacity(0.3),
                            lineWidth: 1.5
                        )
                        .frame(width: 16, height: 16)

                    if goal.isCompleted {
                        Circle()
                            .fill(Color.accentColor)
                            .frame(width: 16, height: 16)

                        Image(systemName: "checkmark")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
                .contentShape(Circle())
            }
            .buttonStyle(MinimalCheckButtonStyle())

            // テキスト
            Text(goal.title)
                .font(.system(size: 12))
                .foregroundColor(goal.isCompleted ? .secondary : .primary)
                .strikethrough(goal.isCompleted, color: .secondary.opacity(0.5))
                .lineLimit(2)

            Spacer()
        }
        .padding(.vertical, 4)
    }
}

/// ミニマルなチェックボタンスタイル
struct MinimalCheckButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.9 : 1.0)
            .animation(.easeOut(duration: 0.1), value: configuration.isPressed)
    }
}

/// 進捗ドット
struct ProgressDots: View {
    let completed: Int
    let total: Int

    var body: some View {
        HStack(spacing: 3) {
            ForEach(0..<total, id: \.self) { index in
                Circle()
                    .fill(index < completed ? Color.accentColor : Color.secondary.opacity(0.2))
                    .frame(width: 5, height: 5)
            }
        }
    }
}
