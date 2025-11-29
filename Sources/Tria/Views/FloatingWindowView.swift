import SwiftUI

/// ミニマルなフローティングウィンドウのビュー
struct FloatingWindowView: View {
    @EnvironmentObject var goalStore: GoalStore
    @State private var newGoalTitle = ""
    @State private var showingConfetti = false
    @State private var confettiOrigin: CGPoint?
    @State private var isHovered = false
    @State private var goalPositions: [UUID: CGPoint] = [:]
    @State private var selectedLevel: GoalLevel = .daily

    private let windowWidth: CGFloat = 220

    private var currentAccentColor: Color {
        selectedLevel.accentColor
    }

    private var currentGoals: [Goal] {
        goalStore.goals(for: selectedLevel)
    }

    var body: some View {
        VStack(spacing: 0) {
            // レベル切り替えバー（上部）
            levelSwitcher
            Divider()
                .padding(.horizontal, 10)

            // 目標リスト
            VStack(alignment: .leading, spacing: 2) {
                ForEach(Array(currentGoals.enumerated()), id: \.element.id) { index, goal in
                    let goalId = goal.id
                    let wasCompleted = goal.isCompleted
                    NumberedGoalRow(
                        number: index + 1,
                        goal: goal,
                        accentColor: currentAccentColor,
                        onToggle: {
                            if !wasCompleted {
                                confettiOrigin = goalPositions[goalId]
                                showingConfetti = true
                            }
                            goalStore.toggleGoalCompletion(id: goalId)
                        }
                    )
                    .background(
                        GeometryReader { geo in
                            Color.clear.preference(
                                key: GoalPositionPreferenceKey.self,
                                value: [goalId: CGPoint(
                                    x: geo.frame(in: .named("floatingContainer")).midX,
                                    y: geo.frame(in: .named("floatingContainer")).midY
                                )]
                            )
                        }
                    )
                }

                // 新しい目標を追加（3つ未満の場合）
                if goalStore.canAddGoal(for: selectedLevel) {
                    addGoalField
                }

                // 空の状態
                if currentGoals.isEmpty {
                    emptyState
                }
            }
            .padding(10)
            .transaction { $0.animation = nil } // レイアウトの暗黙アニメーションを無効化
        }
        .frame(width: windowWidth)
        .fixedSize(horizontal: false, vertical: true)
        .coordinateSpace(name: "floatingContainer")
        .onPreferenceChange(GoalPositionPreferenceKey.self) { positions in
            goalPositions = positions
        }
        // レイアウト変更時は即時反映し、ウィンドウリサイズとの二重アニメーションを防ぐ
        .transaction { $0.animation = nil }
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
                ConfettiView(originPoint: confettiOrigin)
                    .allowsHitTesting(false)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                            showingConfetti = false
                            confettiOrigin = nil
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

    // MARK: - Level Switcher

    private var levelSwitcher: some View {
        HStack(spacing: 8) {
            ForEach(GoalLevel.allCases, id: \.self) { level in
                levelSwitchButton(level: level)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
    }

    private func levelSwitchButton(level: GoalLevel) -> some View {
        let goals = goalStore.goals(for: level)
        let completed = goals.filter { $0.isCompleted }.count
        let isSelected = selectedLevel == level

        return Button {
            // レイアウト変化を即時反映し、ウィンドウリサイズとの競合を避ける
            selectedLevel = level
        } label: {
            HStack(spacing: 4) {
                // 進捗ドット
                HStack(spacing: 2) {
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .fill(i < completed ? level.accentColor : Color.secondary.opacity(0.2))
                            .frame(width: 5, height: 5)
                    }
                }

                Text(level.displayName)
                    .font(.system(size: 9, weight: isSelected ? .semibold : .medium, design: .rounded))
                    .foregroundColor(isSelected ? level.accentColor : .secondary.opacity(0.7))
            }
            .padding(.horizontal, 6)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: 4)
                    .fill(isSelected ? level.accentColor.opacity(0.1) : Color.secondary.opacity(0.06))
            )
        }
        .buttonStyle(.plain)
    }

    private var addGoalField: some View {
        let nextNumber = currentGoals.count + 1
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
        let emptyMessage: String = {
            switch selectedLevel {
            case .daily: return "今日の3つを追加"
            case .weekly: return "今週の3つを追加"
            case .monthly: return "今月の3つを追加"
            }
        }()

        return VStack(spacing: 4) {
            HStack(spacing: 6) {
                ForEach(1...3, id: \.self) { num in
                    Text("\(num)")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundColor(currentAccentColor.opacity(0.25))
                }
            }
            Text(emptyMessage)
                .font(.system(size: 10))
                .foregroundColor(.secondary.opacity(0.5))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
    }

    private func addNewGoal() {
        let title = newGoalTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }

        goalStore.addGoal(title: title, level: selectedLevel)
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
