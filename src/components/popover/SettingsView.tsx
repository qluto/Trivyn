export default function SettingsView() {
  const weekStartOptions = [
    { value: 1, label: '日曜日' },
    { value: 2, label: '月曜日' },
  ];

  const languageOptions = [
    { value: 'system', label: 'システム設定' },
    { value: 'ja', label: '日本語' },
    { value: 'en', label: 'English' },
  ];

  return (
    <div className="p-4 space-y-6">
      <div data-tauri-drag-region>
        <h2 className="text-lg font-semibold text-primary mb-2">設定</h2>
        <p className="text-sm text-secondary">
          アプリケーションの設定を変更できます
        </p>
      </div>

      {/* Week start setting */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-primary block">
          週の開始日
        </label>
        <p className="text-xs text-secondary mb-2">
          週次目標の開始曜日を設定します
        </p>
        <select
          className="
            w-full p-3 rounded-lg
            bg-white/5 border border-white/10
            text-sm text-primary
            focus:outline-none focus:ring-2 focus:ring-white/20
            cursor-pointer
          "
          defaultValue={2}
        >
          {weekStartOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-800">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Language setting */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-primary block">
          言語
        </label>
        <p className="text-xs text-secondary mb-2">
          アプリケーションの表示言語を設定します
        </p>
        <select
          className="
            w-full p-3 rounded-lg
            bg-white/5 border border-white/10
            text-sm text-primary
            focus:outline-none focus:ring-2 focus:ring-white/20
            cursor-pointer
          "
          defaultValue="system"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-800">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notifications setting */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-primary block">
          通知
        </label>
        <p className="text-xs text-secondary mb-2">
          リマインダー通知の設定
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              defaultChecked
            />
            <div className="flex-1">
              <div className="text-sm text-primary">週次リマインダー</div>
              <div className="text-xs text-secondary">月曜日に通知</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              defaultChecked
            />
            <div className="flex-1">
              <div className="text-sm text-primary">月次リマインダー</div>
              <div className="text-xs text-secondary">月初に通知</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              defaultChecked
            />
            <div className="flex-1">
              <div className="text-sm text-primary">振り返りプロンプト</div>
              <div className="text-xs text-secondary">週末・月末に通知</div>
            </div>
          </label>
        </div>
      </div>

      {/* App info */}
      <div className="pt-4 border-t border-white/10" data-tauri-drag-region>
        <div className="text-xs text-secondary space-y-1">
          <div>Tria v0.1.0</div>
          <div>Three Wins 生産性アプリ</div>
        </div>
      </div>
    </div>
  );
}
