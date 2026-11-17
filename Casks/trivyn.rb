cask "trivyn" do
  version "0.4.0"

  on_arm do
    sha256 "6e6b752803aac625e19a0c5f693196402c11028bb0cad33df818315538d5f67a"
    url "https://github.com/qluto/Trivyn/releases/download/v#{version}/Trivyn_#{version}_aarch64.dmg"
  end

  on_intel do
    sha256 "ec6738e1b7a8b2d4c5668b937290d6c7566c3bca1161c40c017c1c3939a82286"
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
