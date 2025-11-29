import SwiftUI
import AppKit

/// Confetti（紙吹雪）アニメーションビュー
struct ConfettiView: View {
    @State private var particles: [ConfettiParticle] = []
    @State private var animationStarted = false

    private let colors: [Color] = [
        Color(red: 0.2, green: 0.4, blue: 0.7),   // ネイビー
        Color(red: 0.3, green: 0.6, blue: 0.8),   // シアン
        Color(red: 0.5, green: 0.7, blue: 0.9),   // ライトブルー
        Color(red: 0.4, green: 0.5, blue: 0.7),   // 薄紫
        Color(red: 0.6, green: 0.8, blue: 0.9),   // スカイブルー
    ]

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                ForEach(particles) { particle in
                    ConfettiParticleView(particle: particle, animationStarted: animationStarted)
                }
            }
            .onAppear {
                generateParticles(in: geometry.size)
                withAnimation(.easeOut(duration: 1.5)) {
                    animationStarted = true
                }
            }
        }
    }

    private func generateParticles(in size: CGSize) {
        particles = (0..<30).map { _ in
            ConfettiParticle(
                color: colors.randomElement() ?? .blue,
                startPosition: CGPoint(
                    x: CGFloat.random(in: size.width * 0.3...size.width * 0.7),
                    y: size.height * 0.3
                ),
                endPosition: CGPoint(
                    x: CGFloat.random(in: 0...size.width),
                    y: size.height + 50
                ),
                rotation: Double.random(in: 0...360),
                scale: CGFloat.random(in: 0.5...1.2),
                delay: Double.random(in: 0...0.3)
            )
        }
    }
}

struct ConfettiParticle: Identifiable {
    let id = UUID()
    let color: Color
    let startPosition: CGPoint
    let endPosition: CGPoint
    let rotation: Double
    let scale: CGFloat
    let delay: Double
    let shape: ConfettiShape = ConfettiShape.allCases.randomElement() ?? .rectangle

    enum ConfettiShape: CaseIterable {
        case rectangle
        case circle
        case triangle
    }
}

struct ConfettiParticleView: View {
    let particle: ConfettiParticle
    let animationStarted: Bool

    var body: some View {
        Group {
            switch particle.shape {
            case .rectangle:
                Rectangle()
                    .fill(particle.color)
                    .frame(width: 8 * particle.scale, height: 4 * particle.scale)
            case .circle:
                Circle()
                    .fill(particle.color)
                    .frame(width: 6 * particle.scale, height: 6 * particle.scale)
            case .triangle:
                TriangleShape()
                    .fill(particle.color)
                    .frame(width: 8 * particle.scale, height: 8 * particle.scale)
            }
        }
        .rotationEffect(.degrees(animationStarted ? particle.rotation + 360 : particle.rotation))
        .position(animationStarted ? particle.endPosition : particle.startPosition)
        .opacity(animationStarted ? 0 : 1)
        .animation(
            .easeOut(duration: 1.2)
                .delay(particle.delay),
            value: animationStarted
        )
    }
}

struct TriangleShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.midX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

// MARK: - Preview

#Preview {
    ConfettiView()
        .frame(width: 300, height: 400)
        .background(Color.gray.opacity(0.2))
}
