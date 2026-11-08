// Soft vignette: darkens towards the corners by up to `darkness`, spread controlled by `offset`.
uniform sampler2D tDiffuse;
uniform float darkness;
uniform float offset;
varying vec2 vUv;

void main() {
	vec4 texel = texture2D( tDiffuse, vUv );
	vec2 uv = ( vUv - vec2( 0.5 ) ) * offset;
	float falloff = clamp( dot( uv, uv ) * 2.0, 0.0, 1.0 );
	gl_FragColor = vec4( texel.rgb * ( 1.0 - darkness * falloff ), texel.a );
}
