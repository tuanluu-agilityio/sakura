// Sakura toon patch for MeshStandardMaterial. Two sections split by the marker line below.
// Section 1 is injected after <lights_physical_pars_fragment>, section 2 replaces <lights_fragment_end>.
// TOON_* constants are #defines generated from TOON_CONSTANTS in toon.ts.
uniform vec3 uToonShadowTint;
uniform vec3 uToonRim;
float sakuraLit = 0.0;

float sakuraLum( const in vec3 c ) { return dot( c, vec3( 0.2126, 0.7152, 0.0722 ) ); }

// Mirrors toonBand() in toon.ts: half-lambert -> 3 soft plateaus (TOON_L0..TOON_L2).
float sakuraToonBand( const in float ndl ) {
	float h = ndl * 0.5 + 0.5;
	float a = smoothstep( TOON_B0 - TOON_HW, TOON_B0 + TOON_HW, h );
	float b = smoothstep( TOON_B1 - TOON_HW, TOON_B1 + TOON_HW, h );
	return TOON_L0 + ( TOON_L1 - TOON_L0 ) * a + ( TOON_L2 - TOON_L1 ) * b;
}

// Accumulates banded light (shadow already folded into directLight.color); no PBR terms.
void RE_Direct_SakuraToon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float band01 = ( sakuraToonBand( dot( geometryNormal, directLight.direction ) ) - TOON_L0 ) / ( TOON_L2 - TOON_L0 );
	sakuraLit += band01 * sakuraLum( directLight.color );
}

#undef RE_Direct
#define RE_Direct RE_Direct_SakuraToon
//#split
#include <lights_fragment_end>
{
	float sakuraRef = 0.0;
	#if NUM_DIR_LIGHTS > 0
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) sakuraRef += sakuraLum( directionalLights[ i ].color );
	#endif
	#if NUM_SUN_LIGHTS > 0
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) sakuraRef += sakuraLum( sunLights[ i ].color );
	#endif
	// k: 0 = fully shadowed / facing away, 1 = fully lit. No sun at all -> flat base colour.
	float k = sakuraRef > 0.0 ? clamp( sakuraLit / sakuraRef, 0.0, 1.0 ) : 1.0;
	float t = mix( TOON_L0, TOON_L2, k );
	// Banded base colour (floor TOON_L0, never black), pulled towards the lavender tint as light drops.
	vec3 col = mix( diffuseColor.rgb * t, uToonShadowTint, TOON_SHADOW_MIX * ( 1.0 - k ) );
	float rimF = pow( 1.0 - saturate( dot( geometryNormal, geometryViewDir ) ), TOON_RIM_POWER ) * TOON_RIM_STRENGTH;
	col = mix( col, uToonRim, saturate( rimF ) * TOON_RIM_MIX );
	reflectedLight.directDiffuse = col;
	reflectedLight.indirectDiffuse = vec3( 0.0 );
	reflectedLight.directSpecular = vec3( 0.0 );
	reflectedLight.indirectSpecular = vec3( 0.0 );
}
