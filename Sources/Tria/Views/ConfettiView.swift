import SwiftUI
import AppKit

/// Confetti（紙吹雪）アニメーションビュー
struct ConfettiView: View {
    /// 紙吹雪の開始位置（指定しない場合は中央から）
    var originPoint: CGPoint?

    @State private var particles: [ConfettiParticle] = []
    @State private var startTime: Date = Date()

    // 適度に華やかな色味
    private let colors: [Color] = [
        Color(red: 0.30, green: 0.50, blue: 0.80),  // ブルー
        Color(red: 0.40, green: 0.65, blue: 0.85),  // スカイブルー
        Color(red: 0.55, green: 0.45, blue: 0.75),  // パープル
        Color(red: 0.35, green: 0.70, blue: 0.70),  // ティール
        Color(red: 0.65, green: 0.55, blue: 0.80),  // ラベンダー
        Color(red: 0.45, green: 0.60, blue: 0.90),  // コーンフラワー
    ]

    var body: some View {
        GeometryReader { geometry in
            TimelineView(.animation) { timeline in
                let elapsed = timeline.date.timeIntervalSince(startTime)

                ZStack {
                    ForEach(particles) { particle in
                        ConfettiParticleView(
                            particle: particle,
                            elapsed: elapsed,
                            containerSize: geometry.size
                        )
                    }
                }
            }
            .onAppear {
                startTime = Date()
                generateParticles(in: geometry.size)
            }
        }
    }

    private func generateParticles(in size: CGSize) {
        // 開始位置（指定があればその位置、なければ中央）
        let origin = originPoint ?? CGPoint(x: size.width * 0.5, y: size.height * 0.45)

        particles = (0..<35).map { _ in
            return ConfettiParticle(
                color: colors.randomElement() ?? .blue,
                startPosition: CGPoint(
                    x: origin.x + CGFloat.random(in: -20...20),
                    y: origin.y + CGFloat.random(in: -10...10)
                ),
                initialVelocity: CGVector(
                    dx: CGFloat.random(in: -120...120),
                    dy: CGFloat.random(in: (-280)...(-180))
                ),
                rotation: Double.random(in: 0...360),
                rotationSpeed: Double.random(in: 180...400),
                scale: CGFloat.random(in: 0.6...1.1),
                delay: Double.random(in: 0...0.15)
            )
        }
    }
}

struct ConfettiParticle: Identifiable {
    let id = UUID()
    let color: Color
    let startPosition: CGPoint
    let initialVelocity: CGVector
    let rotation: Double
    let rotationSpeed: Double
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
    let elapsed: TimeInterval
    let containerSize: CGSize

    // 重力加速度
    private let gravity: CGFloat = 350

    // アニメーション総時間
    private let totalDuration: TimeInterval = 2.0

    // 物理演算で現在位置を計算
    private var currentPosition: CGPoint {
        let t = max(0, elapsed - particle.delay)
        if t <= 0 { return particle.startPosition }

        // 放物線運動: x = x0 + vx*t, y = y0 + vy*t + 0.5*g*t^2
        let x = particle.startPosition.x + particle.initialVelocity.dx * t
        let y = particle.startPosition.y + particle.initialVelocity.dy * t + 0.5 * gravity * t * t

        return CGPoint(x: x, y: y)
    }

    // 現在の回転角度
    private var currentRotation: Double {
        let t = max(0, elapsed - particle.delay)
        return particle.rotation + particle.rotationSpeed * t
    }

    // 透明度（画面外に出たらフェードアウト）
    private var currentOpacity: Double {
        let t = max(0, elapsed - particle.delay)
        if t <= 0 { return 0 }

        let pos = currentPosition
        // 画面下端に近づいたらフェードアウト
        let fadeStart = containerSize.height * 0.7
        let fadeEnd = containerSize.height + 20
        if pos.y > fadeStart {
            let progress = (pos.y - fadeStart) / (fadeEnd - fadeStart)
            return max(0, 1 - progress)
        }
        // 開始時のフェードイン
        if t < 0.1 {
            return t / 0.1
        }
        return 1
    }

    var body: some View {
        Group {
            switch particle.shape {
            case .rectangle:
                RoundedRectangle(cornerRadius: 1)
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
        .rotationEffect(.degrees(currentRotation))
        .rotation3DEffect(
            .degrees(currentRotation * 0.5),
            axis: (x: 1, y: 0.5, z: 0)
        )
        .position(currentPosition)
        .opacity(currentOpacity)
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

struct ConfettiView_Previews: PreviewProvider {
    static var previews: some View {
        ConfettiView()
            .frame(width: 300, height: 400)
            .background(Color.gray.opacity(0.2))
    }
}
