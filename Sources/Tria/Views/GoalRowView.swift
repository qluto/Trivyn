import SwiftUI

/// 目標の1行を表示するビュー
struct GoalRowView: View {
    let goal: Goal
    let accentColor: Color
    let onToggle: () -> Void
    let onDelete: () -> Void

    @State private var isHovered = false

    var body: some View {
        HStack(spacing: 10) {
            // チェックボタン
            CheckButton(isCompleted: goal.isCompleted, accentColor: accentColor, action: onToggle)

            // 目標テキスト
            Text(goal.title)
                .font(.system(size: 14))
                .foregroundColor(goal.isCompleted ? .secondary : .primary)
                .strikethrough(goal.isCompleted, color: .secondary.opacity(0.5))
                .lineLimit(2)

            Spacer()

            // 削除ボタン（ホバー時のみ表示）
            if isHovered {
                Button(action: onDelete) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary.opacity(0.5))
                }
                .buttonStyle(.plain)
                .transition(.opacity)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(goal.isCompleted
                    ? accentColor.opacity(0.06)
                    : (isHovered ? Color.secondary.opacity(0.06) : Color.clear))
        )
        .contentShape(Rectangle())
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.15)) {
                isHovered = hovering
            }
        }
    }
}

/// シンプルなチェックボタン
struct CheckButton: View {
    let isCompleted: Bool
    let accentColor: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .strokeBorder(isCompleted ? accentColor : Color.secondary.opacity(0.35), lineWidth: 1.5)
                    .frame(width: 20, height: 20)

                if isCompleted {
                    Circle()
                        .fill(accentColor)
                        .frame(width: 20, height: 20)

                    Image(systemName: "checkmark")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            .contentShape(Circle())
        }
        .buttonStyle(CheckButtonStyle())
    }
}

/// チェックボタン用のカスタムスタイル
struct CheckButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.85 : 1.0)
            .animation(.spring(response: 0.2, dampingFraction: 0.6), value: configuration.isPressed)
    }
}
