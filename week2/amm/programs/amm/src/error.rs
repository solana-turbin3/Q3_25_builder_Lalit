use anchor_lang::prelude::*;
use constant_product_curve::CurveError;

#[error_code]
pub enum AmmError {
    #[msg("Invalid amount provided")]
    InvalidAmount,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Curve calculation error")]
    CurveCalculationError,
}

impl From<CurveError> for AmmError {
    fn from(_: CurveError) -> Self {
        AmmError::CurveCalculationError
    }
}
