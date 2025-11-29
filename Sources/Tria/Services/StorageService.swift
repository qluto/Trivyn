import Foundation

/// ローカルストレージサービス（将来的にCloudKit対応）
final class StorageService {
    static let shared = StorageService()

    private let goalsKey = "tria.goals"
    private let userDefaults: UserDefaults

    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
    }

    // MARK: - Goals

    func saveGoals(_ goals: [Goal]) {
        do {
            let data = try JSONEncoder().encode(goals)
            userDefaults.set(data, forKey: goalsKey)
        } catch {
            print("Failed to save goals: \(error)")
        }
    }

    func loadGoals() -> [Goal] {
        guard let data = userDefaults.data(forKey: goalsKey) else {
            return []
        }

        do {
            return try JSONDecoder().decode([Goal].self, from: data)
        } catch {
            print("Failed to load goals: \(error)")
            return []
        }
    }
}

// MARK: - iCloud Support (Future)

extension StorageService {
    /// iCloudストレージのURL
    private var iCloudURL: URL? {
        FileManager.default.url(forUbiquityContainerIdentifier: nil)?
            .appendingPathComponent("Documents")
            .appendingPathComponent("goals.json")
    }

    /// iCloud同期が利用可能かどうか
    var isICloudAvailable: Bool {
        FileManager.default.ubiquityIdentityToken != nil
    }
}
