import SwiftUI

/// ミニマルなフローティングウィンドウのビュー
struct FloatingWindowView: View {
    @EnvironmentObject var goalStore: GoalStore
    @State private var newGoalTitle = ""
    @State private var showingConfetti = false
    @State private var isHovered = false

    private let windowWidth: CGFloat = 220
    private let accentColor = GoalLevel.daily.accentColor

    var body: some View {
        VStack(spacing: 0) {
            // 目標リスト（ヘッダーなし、リストがそのままウィジェット）
            VStack(alignment: .leading, spacing: 2) {
                ForEach(Array(goalStore.dailyGoals.enumerated()), id: \.element.id) { index, goal in
                    let goalId = goal.id
                    let wasCompleted = goal.isCompleted
                    NumberedGoalRow(
                        number: index + 1,
                        goal: goal,
                        accentColor: accentColor,
                        onToggle: {
                            if !wasCompleted {
                                showingConfetti = true
                            }
                            goalStore.toggleGoalCompletion(id: goalId)
                        }
                    )
                }

                // 新しい目標を追加（3つ未満の場合）
                if goalStore.canAddGoal(for: .daily) {
                    addGoalField
                }

                // 空の状態
                if goalStore.dailyGoals.isEmpty {
                    emptyState
                }
            }
            .padding(10)
        }
        .frame(width: windowWidth)
        .fixedSize(horizontal: false, vertical: true)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.12), radius: 8, x: 0, y: 3)
        )
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .strokeBorder(Color.primary.opacity(0.05), lineWidth: 0.5)
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
        // 閉じるボタン（ホバー時のみ表示、右上にオーバーレイ）
        .overlay(alignment: .topTrailing) {
            Button(action: { FloatingWindowController.shared.hideWindow() }) {
                Image(systemName: "xmark")
                    .font(.system(size: 8, weight: .medium))
                    .foregroundColor(.secondary)
                    .frame(width: 16, height: 16)
                    .background(
                        Circle()
                            .fill(.ultraThinMaterial)
                    )
            }
            .buttonStyle(.plain)
            .opacity(isHovered ? 1 : 0)
            .padding(6)
        }
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.12)) {
                isHovered = hovering
            }
        }
    }

    private var addGoalField: some View {
        let nextNumber = goalStore.dailyGoals.count + 1
        return HStack(spacing: 8) {
            // 次の番号（薄く表示）
            Text("\(nextNumber)")
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundColor(.secondary.opacity(0.3))
                .frame(width: 18, height: 18)

            TextField("追加...", text: $newGoalTitle)
                .textFieldStyle(.plain)
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .onSubmit {
                    addNewGoal()
                }
        }
        .padding(.vertical, 5)
        .padding(.horizontal, 4)
    }

    private var emptyState: some View {
        VStack(spacing: 4) {
            HStack(spacing: 6) {
                ForEach(1...3, id: \.self) { num in
                    Text("\(num)")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundColor(accentColor.opacity(0.25))
                }
            }
            Text("今日の3つを追加")
                .font(.system(size: 10))
                .foregroundColor(.secondary.opacity(0.5))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
    }

    private func addNewGoal() {
        let title = newGoalTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }

        goalStore.addGoal(title: title, level: .daily)
        newGoalTitle = ""
    }
}

/// 番号付きの目標行（番号がチェックボックスの役割）
struct NumberedGoalRow: View {
    let number: Int
    let goal: Goal
    let accentColor: Color
    let onToggle: () -> Void

    @State private var isHovered = false

    var body: some View {
        HStack(spacing: 8) {
            // 番号（タップでトグル）
            Button(action: onToggle) {
                ZStack {
                    // 背景円
                    Circle()
                        .fill(goal.isCompleted ? accentColor : Color.clear)
                        .frame(width: 18, height: 18)

                    Circle()
                        .strokeBorder(
                            goal.isCompleted ? accentColor : Color.secondary.opacity(0.25),
                            lineWidth: 1.5
                        )
                        .frame(width: 18, height: 18)

                    // 番号
                    Text("\(number)")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundColor(goal.isCompleted ? .white : .secondary.opacity(0.6))
                }
                .contentShape(Circle())
            }
            .buttonStyle(NumberButtonStyle())

            // テキスト
            Text(goal.title)
                .font(.system(size: 12))
                .foregroundColor(goal.isCompleted ? .secondary.opacity(0.5) : .primary.opacity(0.85))
                .strikethrough(goal.isCompleted, color: .secondary.opacity(0.4))
                .lineLimit(2)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 5)
        .padding(.horizontal, 4)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(isHovered ? Color.primary.opacity(0.03) : Color.clear)
        )
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.1)) {
                isHovered = hovering
            }
        }
    }
}

/// 番号ボタン用のスタイル
struct NumberButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.85 : 1.0)
            .animation(.spring(response: 0.2, dampingFraction: 0.6), value: configuration.isPressed)
    }
}
