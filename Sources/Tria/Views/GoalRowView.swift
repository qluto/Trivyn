import SwiftUI

/// 目標の1行を表示するビュー
struct GoalRowView: View {
    let goal: Goal
    let onToggle: () -> Void
    let onDelete: () -> Void

    @State private var isHovered = false

    var body: some View {
        HStack(spacing: 10) {
            // チェックボタン
            CheckButton(isCompleted: goal.isCompleted, action: onToggle)

            // 目標テキスト
            Text(goal.title)
                .font(.system(size: 13))
                .foregroundColor(goal.isCompleted ? .secondary : .primary)
                .strikethrough(goal.isCompleted, color: .secondary)
                .lineLimit(2)

            Spacer()

            // 削除ボタン（ホバー時のみ表示）
            if isHovered {
                Button(action: onDelete) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary.opacity(0.6))
                }
                .buttonStyle(.plain)
                .transition(.opacity)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(isHovered ? Color.secondary.opacity(0.08) : Color.clear)
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
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .strokeBorder(isCompleted ? Color.accentColor : Color.secondary.opacity(0.4), lineWidth: 1.5)
                    .frame(width: 22, height: 22)

                if isCompleted {
                    Circle()
                        .fill(Color.accentColor)
                        .frame(width: 22, height: 22)

                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .bold))
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
