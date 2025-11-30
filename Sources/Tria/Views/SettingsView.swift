import SwiftUI

/// 設定画面
struct SettingsView: View {
    @Binding var isPresented: Bool
    @ObservedObject private var settings = AppSettings.shared

    var body: some View {
        VStack(spacing: 0) {
            // ヘッダー
            HStack {
                Button(action: { isPresented = false }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 12, weight: .medium))
                }
                .buttonStyle(.borderless)
                .foregroundColor(.secondary)

                Spacer()

                Text("設定")
                    .font(.system(size: 14, weight: .semibold, design: .rounded))

                Spacer()

                // バランス用の透明なスペーサー
                Image(systemName: "chevron.left")
                    .font(.system(size: 12, weight: .medium))
                    .opacity(0)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            Divider()

            // 設定項目
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // 週の始まり設定
                    weekStartSection
                }
                .padding(16)
            }
        }
        .frame(width: 300, height: 340)
    }

    private var weekStartSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("週の始まり")
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundColor(.primary)

            // 曜日選択グリッド
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 4), spacing: 6) {
                ForEach(Weekday.allCases, id: \.self) { weekday in
                    WeekdayButton(
                        weekday: weekday,
                        isSelected: settings.weekStart == weekday
                    ) {
                        withAnimation(.easeInOut(duration: 0.15)) {
                            settings.weekStart = weekday
                        }
                    }
                }
            }

            Text("週次目標の期間がこの曜日から始まります")
                .font(.system(size: 10))
                .foregroundColor(.secondary)
        }
        .padding(12)
        .background(Color.secondary.opacity(0.06))
        .cornerRadius(10)
    }
}

/// 曜日選択ボタン
struct WeekdayButton: View {
    let weekday: Weekday
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(weekday.shortName)
                .font(.system(size: 13, weight: isSelected ? .bold : .medium, design: .rounded))
                .foregroundColor(isSelected ? .white : .primary.opacity(0.7))
                .frame(maxWidth: .infinity)
                .frame(height: 32)
                .background(
                    RoundedRectangle(cornerRadius: 6)
                        .fill(isSelected ? Color.accentColor : Color.secondary.opacity(0.1))
                )
        }
        .buttonStyle(.plain)
    }
}
