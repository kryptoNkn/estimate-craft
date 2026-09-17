//! Валидация JSON конструктора: те же поля и диапазоны, что на фронте.
//! Лишние ключи разрешены — схема может чуть опережать бэкенд.

use serde::Deserialize;
use serde_json::Value;

use crate::error::AppError;

pub const MAX_CONFIG_BYTES: usize = 200 * 1024;
const MAX_OPENINGS: usize = 40;
const HEX_COLOR: &str = "color must be #RRGGBB";

const TEXTURE_TYPES: &[&str] = &[
    "amk",
    "brick",
    "stucco",
    "wood",
    "horizontal",
    "vertical",
];
const FOUNDATION_TYPES: &[&str] = &["monolith", "pile", "tape"];
const PARTITION_MATERIALS: &[&str] = &["drywall", "gasblock", "brick", "pzg"];
const VERANDA_MATERIALS: &[&str] = &["wood_light", "wood_dark", "wpc", "metal"];
const FENCE_STYLES: &[&str] = &["cross", "vertical", "glass", "none"];
const ROOF_TYPES: &[&str] = &["flat", "hip", "gable", "shed", "mansard", "chalet"];
const OPENING_TYPES: &[&str] = &["window", "door"];
const OPENING_VARIANTS: &[&str] = &["standard", "panoramic", "minimal"];
const ARCHITECTURAL_STYLES: &[&str] = &[
    "hi-tech",
    "loft",
    "constructivism",
    "modern",
    "japanese",
    "wright",
    "chalet",
    "american",
    "barnhouse",
    "scandinavian",
    "classic",
    "neoclassic",
    "european",
    "provence",
    "country",
];

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct HouseConfig {
    floors: u8,
    has_garage: bool,
    garage_cars: u8,
    texture_type: String,
    foundation_type: String,
    floor_colors: Vec<String>,
    floor_texture_types: Option<Vec<String>>,
    roof_type: Option<String>,
    architectural_style: Option<String>,
    amk_preset_id: Option<String>,
    selected_preset_id: Option<String>,
    veranda: VerandaConfig,
    rooms: u8,
    partition_material: String,
    openings: Vec<OpeningConfig>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct VerandaConfig {
    has_veranda: bool,
    material: String,
    fence_style: String,
    is_base_closed: bool,
    width: f64,
    length: f64,
    perimeter_offset: Option<f64>,
    base_color: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct OpeningConfig {
    id: Option<String>,
    r#type: String,
    floor: u8,
    perimeter_offset: f64,
    variant: Option<String>,
}

pub fn validate_house_config(config: &Value) -> Result<(), AppError> {
    if !config.is_object() {
        return Err(AppError::Validation("config must be a JSON object".into()));
    }

    let encoded = serde_json::to_vec(config).map_err(|_| AppError::Internal)?;
    if encoded.len() > MAX_CONFIG_BYTES {
        return Err(AppError::Validation("config is too large".into()));
    }

    let parsed: HouseConfig = serde_json::from_value(config.clone()).map_err(|err| {
        AppError::Validation(format!("invalid house config: {err}"))
    })?;

    if !(1..=5).contains(&parsed.floors) {
        return Err(AppError::Validation("floors must be 1-5".into()));
    }
    if !(1..=3).contains(&parsed.garage_cars) {
        return Err(AppError::Validation("garageCars must be 1-3".into()));
    }
    let _ = parsed.has_garage;
    if !(1..=4).contains(&parsed.rooms) {
        return Err(AppError::Validation("rooms must be 1-4".into()));
    }

    one_of("textureType", &parsed.texture_type, TEXTURE_TYPES)?;
    one_of("foundationType", &parsed.foundation_type, FOUNDATION_TYPES)?;
    one_of(
        "partitionMaterial",
        &parsed.partition_material,
        PARTITION_MATERIALS,
    )?;

    if parsed.floor_colors.is_empty() || parsed.floor_colors.len() > 5 {
        return Err(AppError::Validation(
            "floorColors must contain 1-5 colors".into(),
        ));
    }
    for color in &parsed.floor_colors {
        hex_color("floorColors", color)?;
    }

    if let Some(textures) = &parsed.floor_texture_types {
        if textures.len() > 5 {
            return Err(AppError::Validation(
                "floorTextureTypes must contain at most 5 items".into(),
            ));
        }
        for texture in textures {
            one_of("floorTextureTypes", texture, TEXTURE_TYPES)?;
        }
    }

    if let Some(roof) = &parsed.roof_type {
        one_of("roofType", roof, ROOF_TYPES)?;
    }
    if let Some(style) = &parsed.architectural_style {
        one_of("architecturalStyle", style, ARCHITECTURAL_STYLES)?;
    }
    if let Some(preset) = &parsed.amk_preset_id {
        ident("amkPresetId", preset, 16)?;
    }
    if let Some(preset) = &parsed.selected_preset_id {
        ident("selectedPresetId", preset, 64)?;
    }

    one_of("veranda.material", &parsed.veranda.material, VERANDA_MATERIALS)?;
    one_of("veranda.fenceStyle", &parsed.veranda.fence_style, FENCE_STYLES)?;
    finite_range("veranda.width", parsed.veranda.width, 0.5, 30.0)?;
    finite_range("veranda.length", parsed.veranda.length, 0.5, 30.0)?;
    let _ = parsed.veranda.has_veranda;
    let _ = parsed.veranda.is_base_closed;
    if let Some(offset) = parsed.veranda.perimeter_offset {
        finite_range("veranda.perimeterOffset", offset, 0.0, 200.0)?;
    }
    if let Some(color) = &parsed.veranda.base_color {
        hex_color("veranda.baseColor", color)?;
    }

    if parsed.openings.len() > MAX_OPENINGS {
        return Err(AppError::Validation(format!(
            "openings must contain at most {MAX_OPENINGS} items"
        )));
    }
    for opening in &parsed.openings {
        if let Some(id) = &opening.id {
            ident("openings.id", id, 64)?;
        }
        one_of("openings.type", &opening.r#type, OPENING_TYPES)?;
        if opening.floor < 1 || opening.floor > parsed.floors {
            return Err(AppError::Validation(
                "openings.floor must be between 1 and floors".into(),
            ));
        }
        finite_range("openings.perimeterOffset", opening.perimeter_offset, 0.0, 500.0)?;
        if let Some(variant) = &opening.variant {
            one_of("openings.variant", variant, OPENING_VARIANTS)?;
        }
    }

    Ok(())
}

fn one_of(field: &str, value: &str, allowed: &[&str]) -> Result<(), AppError> {
    if allowed.contains(&value) {
        Ok(())
    } else {
        Err(AppError::Validation(format!("{field} is not supported")))
    }
}

fn hex_color(field: &str, value: &str) -> Result<(), AppError> {
    let ok = value.len() == 7
        && value.starts_with('#')
        && value[1..].bytes().all(|b| b.is_ascii_hexdigit());
    if ok {
        Ok(())
    } else {
        Err(AppError::Validation(format!("{field}: {HEX_COLOR}")))
    }
}

fn ident(field: &str, value: &str, max_len: usize) -> Result<(), AppError> {
    let ok = !value.is_empty()
        && value.len() <= max_len
        && value
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_');
    if ok {
        Ok(())
    } else {
        Err(AppError::Validation(format!(
            "{field} must be 1-{max_len} letters, digits, '-' or '_'"
        )))
    }
}

fn finite_range(field: &str, value: f64, min: f64, max: f64) -> Result<(), AppError> {
    if value.is_finite() && (min..=max).contains(&value) {
        Ok(())
    } else {
        Err(AppError::Validation(format!(
            "{field} must be between {min} and {max}"
        )))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn valid() -> Value {
        json!({
            "floors": 2,
            "hasGarage": false,
            "garageCars": 1,
            "textureType": "stucco",
            "foundationType": "monolith",
            "floorColors": ["#ffffff"],
            "veranda": {
                "hasVeranda": false,
                "material": "wood_light",
                "fenceStyle": "none",
                "isBaseClosed": false,
                "width": 4,
                "length": 2
            },
            "rooms": 3,
            "partitionMaterial": "drywall",
            "openings": []
        })
    }

    #[test]
    fn accepts_constructor_payload() {
        assert!(validate_house_config(&valid()).is_ok());
    }

    #[test]
    fn rejects_unknown_texture() {
        let mut config = valid();
        config["textureType"] = json!("marble");
        let err = validate_house_config(&config).unwrap_err();
        assert!(matches!(err, AppError::Validation(msg) if msg.contains("textureType")));
    }

    #[test]
    fn rejects_opening_on_missing_floor() {
        let mut config = valid();
        config["openings"] = json!([{
            "type": "window",
            "floor": 3,
            "perimeterOffset": 1.0
        }]);
        let err = validate_house_config(&config).unwrap_err();
        assert!(matches!(err, AppError::Validation(msg) if msg.contains("openings.floor")));
    }

    #[test]
    fn rejects_non_object() {
        let err = validate_house_config(&json!([])).unwrap_err();
        assert!(matches!(err, AppError::Validation(msg) if msg.contains("JSON object")));
    }
}
