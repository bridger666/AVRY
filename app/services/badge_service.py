"""Badge generation service for AI readiness scores

CRITICAL BRANDING REQUIREMENT:
- ALWAYS use Aivory logo image (frontend/Aivory_logo.png)
- NEVER use plain text "Aivory" as substitute
- See AIVORY_LOGO_PROTOCOL.md for complete guidelines
"""
import base64
import os


def get_logo_base64() -> str:
    """
    Get Aivory logo as base64 encoded data URL.
    
    Returns:
        Base64 encoded PNG data URL
    """
    logo_path = os.path.join(os.path.dirname(__file__), '../../frontend/Aivory_logo.png')
    try:
        with open(logo_path, 'rb') as f:
            logo_data = base64.b64encode(f.read()).decode('utf-8')
            return f"data:image/png;base64,{logo_data}"
    except FileNotFoundError:
        # Fallback if logo not found
        return ""


def get_category_color(category: str) -> str:
    """
    Get color for a readiness category.
    
    Args:
        category: Readiness category name
    
    Returns:
        Hex color code
    """
    colors = {
        "AI Unready": "#E74C3C",    # Red/Orange
        "AI Curious": "#F39C12",    # Yellow/Amber
        "AI Ready": "#3498DB",      # Blue
        "AI Native": "#27AE60"      # Green
    }
    return colors.get(category, "#95A5A6")  # Default gray


def generate_badge(score: float, category: str) -> str:
    """
    Generate SVG badge for AI readiness score.
    
    Creates a downloadable visual badge showing the score and category.
    The badge uses brand purple color and includes the Aivory logo.
    
    Args:
        score: AI readiness score (0-100)
        category: Readiness category name
    
    Returns:
        SVG markup as string
    """
    score_int = int(round(score))
    
    # Brand purple color
    brand_purple = "#4F2D9E"
    
    # Get logo as base64
    logo_data_url = get_logo_base64()
    
    # CRITICAL: Always use logo image, never text
    # Logo dimensions: 1882x432 (aspect ratio ~4.35:1)
    if logo_data_url:
        # Position logo at bottom center with proper aspect ratio
        logo_svg = f'<image href="{logo_data_url}" x="150" y="195" width="100" height="23" preserveAspectRatio="xMidYMid meet"/>'
    else:
        # CRITICAL ERROR: Logo file missing - this should never happen in production
        # Log error and use text fallback only as emergency measure
        import logging
        logging.error("CRITICAL: Aivory logo file not found at frontend/Aivory_logo.png - using text fallback")
        logo_svg = '''<text x="200" y="210" font-size="14" fill="rgba(255,255,255,0.8)" 
        text-anchor="middle" font-weight="300" font-family="'Inter Tight', sans-serif">
    Aivory [LOGO MISSING]
  </text>'''
    
    svg = f'''<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="250" fill="{brand_purple}" rx="15"/>
  
  <!-- Decorative elements -->
  <circle cx="350" cy="50" r="60" fill="rgba(255,255,255,0.08)"/>
  <circle cx="50" cy="200" r="40" fill="rgba(255,255,255,0.08)"/>
  
  <!-- Score -->
  <text x="200" y="100" font-size="72" fill="white" 
        text-anchor="middle" font-weight="300" font-family="'Inter Tight', sans-serif">
    {score_int}
  </text>
  
  <!-- Category -->
  <text x="200" y="140" font-size="24" fill="white" 
        text-anchor="middle" font-weight="200" font-family="'Inter Tight', sans-serif">
    {category}
  </text>
  
  <!-- Subtitle -->
  <text x="200" y="170" font-size="14" fill="rgba(255,255,255,0.7)" 
        text-anchor="middle" font-weight="200" font-family="'Inter Tight', sans-serif">
    Diagnostic Score
  </text>
  
  <!-- Logo at bottom -->
  {logo_svg}
</svg>'''
    
    return svg


def generate_badge_data_url(score: float, category: str) -> str:
    """
    Generate badge as data URL for embedding.
    
    Args:
        score: AI readiness score (0-100)
        category: Readiness category name
    
    Returns:
        Data URL string (data:image/svg+xml;base64,...)
    """
    import base64
    
    svg = generate_badge(score, category)
    svg_bytes = svg.encode('utf-8')
    svg_b64 = base64.b64encode(svg_bytes).decode('utf-8')
    
    return f"data:image/svg+xml;base64,{svg_b64}"
