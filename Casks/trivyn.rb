cask "trivyn" do
  version "0.2.0"

  on_arm do
    sha256 "0d6bf0e6bce068eb00ed3b7ce35cd052d8ca93554d6839afc4f4017f0dbb2155"
    url "https://github.com/qluto/Trivyn/releases/download/v#{version}/Trivyn_#{version}_aarch64.dmg"
  end

  on_intel do
    sha256 "0c56d153732638b092128e2185cc6eced86e2041dd8698839f19548377de6d98"
    url "https://github.com/qluto/Trivyn/releases/download/v#{version}/Trivyn_#{version}_x64.dmg"
  end

  name "Trivyn"
  desc "Three Wins productivity app for managing daily, weekly, and monthly goals"
  homepage "https://github.com/qluto/Trivyn"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "Trivyn.app"

  zap trash: [
    "~/Library/Application Support/com.trivyn.app",
    "~/Library/Caches/com.trivyn.app",
    "~/Library/Preferences/com.trivyn.app.plist",
    "~/Library/Saved Application State/com.trivyn.app.savedState",
  ]
end
