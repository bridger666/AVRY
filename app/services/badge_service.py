"""Badge generation service for AI readiness scores"""


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
    The badge uses color coding based on the category and includes
    Aivory branding.
    
    Args:
        score: AI readiness score (0-100)
        category: Readiness category name
    
    Returns:
        SVG markup as string
    """
    color = get_category_color(category)
    score_int = int(round(score))
    
    svg = f'''<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="250" fill="{color}" rx="15"/>
  
  <!-- Decorative elements -->
  <circle cx="350" cy="50" r="60" fill="rgba(255,255,255,0.1)"/>
  <circle cx="50" cy="200" r="40" fill="rgba(255,255,255,0.1)"/>
  
  <!-- Score -->
  <text x="200" y="110" font-size="80" fill="white" 
        text-anchor="middle" font-weight="bold" font-family="Arial, sans-serif">
    {score_int}
  </text>
  
  <!-- Category -->
  <text x="200" y="155" font-size="28" fill="white" 
        text-anchor="middle" font-weight="600" font-family="Arial, sans-serif">
    {category}
  </text>
  
  <!-- Branding -->
  <text x="200" y="210" font-size="18" fill="rgba(255,255,255,0.9)" 
        text-anchor="middle" font-family="Arial, sans-serif">
    Aivory AI Readiness
  </text>
  
  <!-- Subtitle -->
  <text x="200" y="235" font-size="14" fill="rgba(255,255,255,0.7)" 
        text-anchor="middle" font-family="Arial, sans-serif">
    Diagnostic Score
  </text>
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
