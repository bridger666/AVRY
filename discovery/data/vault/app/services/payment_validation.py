"""
Payment validation service using database payment records.
"""

from typing import Optional
from datetime import datetime

from app.models.blueprint import ValidationResult
from app.database.db_service import db


class PaymentValidationService:
    """
    Validates payment status for product access by checking database payment records.
    
    All users (including super admin) validated identically - super admin has seeded payment records.
    """
    
    BLUEPRINT_PRICE = 79  # $79 for Blueprint tier
    SNAPSHOT_PRICE = 15  # $15 for Snapshot tier
    
    async def validate_blueprint_access(
        self,
        user_id: str
    ) -> ValidationResult:
        """
        Check if user can access Blueprint generation by checking payment records.
        
        Args:
            user_id: User identifier
            
        Returns:
            ValidationResult with access decision
        """
        # Check for paid blueprint record in database
        payments = db.load_all_json("payments")
        user_blueprint_payment = next(
            (p for p in payments 
             if p.get("user_id") == user_id 
             and p.get("product") == "ai_blueprint" 
             and p.get("status") == "paid"),
            None
        )
        
        if user_blueprint_payment:
            return ValidationResult(
                allowed=True,
                bypass=False,
                message="Blueprint access granted - payment verified",
                payment_required=False
            )
        
        # Payment required
        return ValidationResult(
            allowed=False,
            bypass=False,
            message=f"Payment required: ${self.BLUEPRINT_PRICE} for AI Blueprint",
            payment_required=True
        )
    
    async def validate_snapshot_access(
        self,
        user_id: str
    ) -> ValidationResult:
        """
        Check if user can access Snapshot generation by checking payment records.
        
        Args:
            user_id: User identifier
            
        Returns:
            ValidationResult with access decision
        """
        # Check for paid snapshot record in database
        payments = db.load_all_json("payments")
        user_snapshot_payment = next(
            (p for p in payments 
             if p.get("user_id") == user_id 
             and p.get("product") == "ai_snapshot" 
             and p.get("status") == "paid"),
            None
        )
        
        if user_snapshot_payment:
            return ValidationResult(
                allowed=True,
                bypass=False,
                message="Snapshot access granted - payment verified",
                payment_required=False
            )
        
        # Payment required
        return ValidationResult(
            allowed=False,
            bypass=False,
            message=f"Payment required: ${self.SNAPSHOT_PRICE} for AI Snapshot",
            payment_required=True
        )
    
    async def record_payment(
        self,
        user_id: str,
        amount: float,
        payment_method: str = "stripe",
        product: str = "ai_blueprint"
    ) -> bool:
        """
        Record successful payment.
        
        Args:
            user_id: User identifier
            amount: Payment amount
            payment_method: Payment method used
            product: Product purchased (ai_snapshot, ai_blueprint, step3_subscription)
            
        Returns:
            True if recorded successfully
        """
        try:
            from app.utils.id_generator import generate_id
            
            payment_id = generate_id("payment")
            payment_record = {
                "payment_id": payment_id,
                "user_id": user_id,
                "product": product,
                "amount": amount,
                "status": "paid",
                "payment_method": payment_method,
                "created_at": datetime.utcnow().isoformat()
            }
            
            db.save_json("payments", payment_id, payment_record)
            return True
            
        except Exception as e:
            print(f"Error recording payment: {e}")
            return False
    
    async def check_payment_status(
        self,
        user_id: str,
        product: str = "ai_blueprint"
    ) -> bool:
        """
        Check if user has paid for product.
        
        Args:
            user_id: User identifier
            product: Product to check (ai_snapshot, ai_blueprint, step3_subscription)
            
        Returns:
            True if payment completed
        """
        payments = db.load_all_json("payments")
        return any(
            p.get("user_id") == user_id 
            and p.get("product") == product 
            and p.get("status") == "paid"
            for p in payments
        )
