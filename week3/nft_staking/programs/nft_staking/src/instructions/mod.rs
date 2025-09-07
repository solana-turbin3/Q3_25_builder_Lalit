pub mod claim;
pub mod initialize_config;
pub mod intialize_user;
pub mod stake;
pub mod unstake;

// Export all instruction structs
pub use claim::*;
pub use initialize_config::*;
pub use intialize_user::*;
pub use stake::*;
pub use unstake::*;
