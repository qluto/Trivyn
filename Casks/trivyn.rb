cask "trivyn" do
  version "0.2.2"

  on_arm do
    sha256 "aeb5ac85020a254f1976e26d3ae3dd7fabfa92d589ad28b88849c74381534ad0"
    url "https://github.com/qluto/Trivyn/releases/download/v#{version}/Trivyn_#{version}_aarch64.dmg"
  end

  on_intel do
    sha256 "66ff9cbcf4d364fe17895cd469e710cfea9908e09546410b3f7f724ab2072308"
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
