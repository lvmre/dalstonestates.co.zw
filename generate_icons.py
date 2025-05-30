import os
from PIL import Image, ImageDraw
import cairosvg
import io

# Icon sizes required for PWA
icon_sizes = [72, 96, 128, 144, 152, 192, 384, 512]

def svg_to_png(svg_file, output_file, size):
    """Convert SVG to PNG with specified size"""
    try:
        # Convert SVG to PNG using cairosvg
        png_data = cairosvg.svg2png(
            url=svg_file,
            output_width=size,
            output_height=size,
            background_color='#2d5016'  # Green background
        )
        
        # Save PNG
        with open(output_file, 'wb') as f:
            f.write(png_data)
        
        print(f"✓ Generated {output_file} ({size}x{size})")
        return True
    except Exception as e:
        print(f"✗ Error generating {output_file}: {e}")
        return False

def generate_all_icons():
    """Generate all required PWA icons"""
    print("Generating PWA icons...")
    
    # Check if SVG files exist
    icon_full = "icon-full.svg"
    icon_simple = "icon-simple.svg"
    
    if not os.path.exists(icon_full):
        print(f"Error: {icon_full} not found!")
        return False
    
    if not os.path.exists(icon_simple):
        print(f"Error: {icon_simple} not found!")
        return False
    
    success_count = 0
    
    for size in icon_sizes:
        # Use detailed SVG for larger icons, simple for smaller ones
        svg_file = icon_full if size >= 128 else icon_simple
        output_file = f"icon-{size}x{size}.png"
        
        if svg_to_png(svg_file, output_file, size):
            success_count += 1
    
    print(f"\nGenerated {success_count}/{len(icon_sizes)} icons successfully!")
    
    if success_count == len(icon_sizes):
        print("\n✓ All PWA icons generated successfully!")
        print("Next steps:")
        print("1. Icons are ready for use in manifest.json")
        print("2. Test PWA installation functionality")
        return True
    else:
        print(f"\n⚠ {len(icon_sizes) - success_count} icons failed to generate")
        return False

if __name__ == "__main__":
    generate_all_icons()
