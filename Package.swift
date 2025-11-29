// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Tria",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "Tria", targets: ["Tria"])
    ],
    targets: [
        .executableTarget(
            name: "Tria",
            path: "Sources/Tria"
        )
    ]
)
