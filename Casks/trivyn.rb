cask "trivyn" do
  version "0.2.1"

  on_arm do
    sha256 "a69d87f9f5fc3699350ebfa76b0169c3dd1c94110332d7b41902ac88ed603293"
    url "https://github.com/qluto/Trivyn/releases/download/v#{version}/Trivyn_#{version}_aarch64.dmg"
  end

  on_intel do
    sha256 "71ee78acbebebd65b5687bcbcc7d3bded6c020842002a5dfa6469da7bebffe83"
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
