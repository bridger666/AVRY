"""Contact form API routes"""
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pathlib import Path

from app.models.contact import ContactForm, ContactResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactResponse)
async def submit_contact(contact: ContactForm):
    """
    Process contact form submission.
    
    For MVP, logs contact information to a file.
    In production, this would integrate with CRM or email service.
    """
    try:
        # Log contact submission
        logger.info(
            f"Contact form submission: {contact.name} ({contact.email}) "
            f"from {contact.company}"
        )
        
        # Store contact information (MVP: append to file)
        contacts_file = Path("contacts.log")
        timestamp = datetime.utcnow().isoformat()
        
        with open(contacts_file, "a") as f:
            f.write(f"\n{'='*80}\n")
            f.write(f"Timestamp: {timestamp}\n")
            f.write(f"Name: {contact.name}\n")
            f.write(f"Company: {contact.company}\n")
            f.write(f"Email: {contact.email}\n")
            f.write(f"Message: {contact.message}\n")
        
        logger.info(f"Contact information saved to {contacts_file}")
        
        return ContactResponse(
            success=True,
            message="Thank you for your interest! We'll be in touch soon."
        )
        
    except Exception as e:
        logger.error(f"Error processing contact form: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to process contact form. Please try again."
        )
