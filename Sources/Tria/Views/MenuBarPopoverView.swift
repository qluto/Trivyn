import SwiftUI

/// ゴール位置を追跡するためのPreferenceKey
struct GoalPositionPreferenceKey: PreferenceKey {
    static var defaultValue: [UUID: CGPoint] = [:]

    static func reduce(value: inout [UUID: CGPoint], nextValue: () -> [UUID: CGPoint]) {
        value.merge(nextValue()) { _, new in new }
    }
}

/// メニューバーポップオーバーのメインビュー
struct MenuBarPopoverView: View {
    @EnvironmentObject var goalStore: GoalStore
    @State private var newGoalTitle = ""
    @State private var showingConfetti = false
    @State private var confettiGoalId: UUID?
    @State private var confettiOrigin: CGPoint?
    @State private var showingHistory = false
    @State private var showingReflection: ReflectionType?
    @State private var showingSettings = false
    @State private var goalPositions: [UUID: CGPoint] = [:]

    var body: some View {
        Group {
            if showingHistory {
                HistoryView(isPresented: $showingHistory)
                    .environmentObject(goalStore)
            } else if let reflectionType = showingReflection {
                ReflectionView(
                    isPresented: Binding(
                        get: { showingReflection != nil },
                        set: { if !$0 { showingReflection = nil } }
                    ),
                    type: reflectionType
                )
                .environmentObject(goalStore)
            } else if showingSettings {
                SettingsView(isPresented: $showingSettings)
            } else {
                mainView
            }
        }
        .fixedSize()
    }

    private var mainView: some View {
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
                                    confettiOrigin = goalPositions[goalId]
                                    showingConfetti = true
                                }
                                goalStore.toggleGoalCompletion(id: goalId)
                            },
                            onDelete: {
                                goalStore.deleteGoal(goal)
                            }
                        )
                        .background(
                            GeometryReader { geo in
                                Color.clear.preference(
                                    key: GoalPositionPreferenceKey.self,
                                    value: [goalId: CGPoint(
                                        x: geo.frame(in: .named("popoverContainer")).midX,
                                        y: geo.frame(in: .named("popoverContainer")).midY
                                    )]
                                )
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
        .coordinateSpace(name: "popoverContainer")
        .onPreferenceChange(GoalPositionPreferenceKey.self) { positions in
            goalPositions = positions
        }
        .overlay {
            if showingConfetti {
                ConfettiView(originPoint: confettiOrigin)
                    .allowsHitTesting(false)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                            showingConfetti = false
                            confettiGoalId = nil
                            confettiOrigin = nil
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
        HStack(spacing: 12) {
            Button(action: { FloatingWindowController.shared.showWindow() }) {
                Image(systemName: "macwindow.on.rectangle")
                    .font(.system(size: 12))
            }
            .buttonStyle(.borderless)
            .foregroundColor(.secondary)
            .help("フローティングウィンドウ")

            // 振り返りボタン（週・月選択可能）
            Menu {
                Button("今週の振り返り") { showingReflection = .weekly }
                Button("今月の振り返り") { showingReflection = .monthly }
            } label: {
                HStack(spacing: 2) {
                    Image(systemName: "text.badge.checkmark")
                        .font(.system(size: 11))
                    Text("振り返り")
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                }
            }
            .menuStyle(.borderlessButton)
            .foregroundColor(.secondary)

            Spacer()

            Button(action: { showingSettings = true }) {
                Image(systemName: "gearshape")
                    .font(.system(size: 12))
            }
            .buttonStyle(.borderless)
            .foregroundColor(.secondary)
            .help("設定")

            Button(action: { showingHistory = true }) {
                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.system(size: 12))
                    Text("履歴")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                }
            }
            .buttonStyle(.borderless)
            .foregroundColor(.secondary)
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
