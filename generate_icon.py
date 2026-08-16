from PIL import Image, ImageDraw, ImageFont
import math

def draw_drone_battery_icon():
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. White Canvas Background with Soft Rounded Corners (rx=108)
    corner_radius = 108
    draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=(255, 255, 255, 255))

    # Royal Blue Color: #0B4F94 -> (11, 79, 148, 255)
    blue_color = (11, 79, 148, 255)
    line_width = 18

    # 2. Connecting Diagonal Arms
    draw.line([(144, 144), (208, 208)], fill=blue_color, width=line_width)
    draw.line([(368, 144), (304, 208)], fill=blue_color, width=line_width)
    draw.line([(144, 368), (208, 304)], fill=blue_color, width=line_width)
    draw.line([(368, 368), (304, 304)], fill=blue_color, width=line_width)

    # 3. Battery Terminal Cap
    draw.rounded_rectangle([232, 144, 280, 168], radius=6, fill=blue_color)

    # 4. Battery Main Frame
    draw.rounded_rectangle([196, 164, 316, 348], radius=24, outline=blue_color, width=line_width)

    # 5. Lightning Bolt Icon Inside Battery
    # Points: M264 196 L230 258 H258 L246 320 L282 250 H254 L264 196 Z
    lightning_pts = [(264, 196), (230, 258), (258, 258), (246, 320), (282, 250), (254, 250), (264, 196)]
    draw.polygon(lightning_pts, fill=blue_color)

    # 6. Rotors at 4 Corners: (144, 144), (368, 144), (144, 368), (368, 368)
    centers = [
        ((144, 144), -45),
        ((368, 144), 45),
        ((144, 368), -135),
        ((368, 368), 135)
    ]

    for (cx, cy), base_angle in centers:
        # Hub circle
        r = 16
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=blue_color)

        # Propeller Blades
        for angle in [base_angle, base_angle + 180]:
            rad = math.radians(angle)
            cos_a = math.cos(rad)
            sin_a = math.sin(rad)

            # Draw blade ellipse
            bx = cx + cos_a * 35
            by = cy + sin_a * 35
            draw.ellipse([bx - 18, by - 10, bx + 18, by + 10], fill=blue_color)

    # Save PNG
    png_path = "public/drone_battery_app_icon.png"
    img.save(png_path, "PNG")
    print(f"Saved PNG to {png_path}")

    # Save ICO with multiple sizes (256, 128, 64, 48, 32, 16)
    ico_path = "public/drone_battery_app_icon.ico"
    ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img.save(ico_path, format="ICO", sizes=ico_sizes)
    print(f"Saved ICO to {ico_path}")

if __name__ == "__main__":
    draw_drone_battery_icon()
