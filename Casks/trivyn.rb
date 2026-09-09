cask "trivyn" do
  version "0.3.0"

  on_arm do
    sha256 "a6ddf3e582835c88abf9d25e4b3c4b826545f36a178900a614e73c4c805003dd"
    url "https://github.com/qluto/Trivyn/releases/download/v#{version}/Trivyn_#{version}_aarch64.dmg"
  end

  on_intel do
    sha256 "6c007377a4d44c3adf66d685df073cbffbd26ec66ef13ef43998a89d2b2ba353"
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
