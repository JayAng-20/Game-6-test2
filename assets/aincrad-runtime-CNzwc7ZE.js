import{a as e,r as t}from"./world-CeqXiYg9.js";import{$ as n,B as r,C as i,Ct as a,D as o,E as s,F as c,G as l,H as u,I as d,J as f,K as p,L as m,M as h,O as g,P as _,Q as v,R as y,S as b,St as x,T as S,U as C,V as w,W as T,X as ee,Y as E,Z as D,_ as te,_t as ne,at as re,b as O,bt as k,d as A,dt as j,et as ie,ft as ae,g as oe,gt as se,h as M,ht as N,i as ce,it as P,j as F,k as I,lt as le,m as L,mt as ue,nt as R,ot as de,pt as fe,q as pe,rt as z,st as me,t as he,tt as ge,ut as B,v as _e,vt as ve,w as V,x as ye,xt as H,y as be,yt as U,z as xe}from"./ai-D_hWYQnq.js";import{a as W,i as Se,r as G,t as Ce}from"./aincrad-suRKijvJ.js";var we=class e extends p{constructor(){let t=e.SkyShader,n=new B({name:t.name,uniforms:U.clone(t.uniforms),vertexShader:t.vertexShader,fragmentShader:t.fragmentShader,side:1,depthWrite:!1});super(new _e(1,1,1),n),this.isSky=!0}};we.SkyShader={name:`SkyShader`,uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new H},up:{value:new H(0,1,0)},cloudScale:{value:2e-4},cloudSpeed:{value:1e-4},cloudCoverage:{value:.4},cloudDensity:{value:.4},cloudElevation:{value:.5},showSunDisc:{value:1},time:{value:0}},vertexShader:`
		uniform vec3 sunPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;
		uniform vec3 up;

		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		// constants for atmospheric scattering
		const float e = 2.71828182845904523536028747135266249775724709369995957;
		const float pi = 3.141592653589793238462643383279502884197169;

		// wavelength of used primaries, according to preetham
		const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
		// this pre-calculation replaces older TotalRayleigh(vec3 lambda) function:
		// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
		const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		// mie stuff
		// K coefficient for the primaries
		const float v = 4.0;
		const vec3 K = vec3( 0.686, 0.678, 0.666 );
		// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
		const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		// earth shadow hack
		// cutoffAngle = pi / 1.95;
		const float cutoffAngle = 1.6110731556870734;
		const float steepness = 1.5;
		const float EE = 1000.0;

		float sunIntensity( float zenithAngleCos ) {
			zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
		}

		vec3 totalMie( float T ) {
			float c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}

		void main() {

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			gl_Position.z = gl_Position.w; // set z to camera.far

			vSunDirection = normalize( sunPosition );

			vSunE = sunIntensity( dot( vSunDirection, up ) );

			vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

			float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

			// extinction (absorption + out scattering)
			// rayleigh coefficients
			vBetaR = totalRayleigh * rayleighCoefficient;

			// mie coefficients
			vBetaM = totalMie( turbidity ) * mieCoefficient;

		}`,fragmentShader:`
		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		uniform float mieDirectionalG;
		uniform vec3 up;
		uniform float cloudScale;
		uniform float cloudSpeed;
		uniform float cloudCoverage;
		uniform float cloudDensity;
		uniform float cloudElevation;
		uniform float showSunDisc;
		uniform float time;

		// Cloud noise functions
		float hash( vec2 p ) {
			return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453123 );
		}

		float noise( vec2 p ) {
			vec2 i = floor( p );
			vec2 f = fract( p );
			f = f * f * ( 3.0 - 2.0 * f );
			float a = hash( i );
			float b = hash( i + vec2( 1.0, 0.0 ) );
			float c = hash( i + vec2( 0.0, 1.0 ) );
			float d = hash( i + vec2( 1.0, 1.0 ) );
			return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y );
		}

		float fbm( vec2 p ) {
			float value = 0.0;
			float amplitude = 0.5;
			for ( int i = 0; i < 5; i ++ ) {
				value += amplitude * noise( p );
				p *= 2.0;
				amplitude *= 0.5;
			}
			return value;
		}

		// constants for atmospheric scattering
		const float pi = 3.141592653589793238462643383279502884197169;

		const float n = 1.0003; // refractive index of air
		const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

		// optical length at zenith for molecules
		const float rayleighZenithLength = 8.4E3;
		const float mieZenithLength = 1.25E3;
		// 66 arc seconds -> degrees, and the cosine of that
		const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

		// 3.0 / ( 16.0 * pi )
		const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
		// 1.0 / ( 4.0 * pi )
		const float ONE_OVER_FOURPI = 0.07957747154594767;

		float rayleighPhase( float cosTheta ) {
			return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
		}

		float hgPhase( float cosTheta, float g ) {
			float g2 = pow( g, 2.0 );
			float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
			return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
		}

		void main() {

			vec3 direction = normalize( vWorldPosition - cameraPosition );

			// optical length
			// cutoff angle at 90 to avoid singularity in next formula.
			float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
			float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
			float sR = rayleighZenithLength * inverse;
			float sM = mieZenithLength * inverse;

			// combined extinction factor
			vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

			// in scattering
			float cosTheta = dot( direction, vSunDirection );

			float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
			vec3 betaRTheta = vBetaR * rPhase;

			float mPhase = hgPhase( cosTheta, mieDirectionalG );
			vec3 betaMTheta = vBetaM * mPhase;

			vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

			// nightsky
			float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
			float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;

			// composition + solar disc
			float sundisc = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta ) * showSunDisc;
			L0 += ( vSunE * 19000.0 * Fex ) * sundisc;

			vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

			// Clouds
			if ( direction.y > 0.0 && cloudCoverage > 0.0 ) {

				// Project to cloud plane (higher elevation = clouds appear lower/closer)
				float elevation = mix( 1.0, 0.1, cloudElevation );
				vec2 cloudUV = direction.xz / ( direction.y * elevation );
				cloudUV *= cloudScale;
				cloudUV += time * cloudSpeed;

				// Multi-octave noise for fluffy clouds
				float cloudNoise = fbm( cloudUV * 1000.0 );
				cloudNoise += 0.5 * fbm( cloudUV * 2000.0 + 3.7 );
				cloudNoise = cloudNoise * 0.5 + 0.5;

				// Apply coverage threshold
				float cloudMask = smoothstep( 1.0 - cloudCoverage, 1.0 - cloudCoverage + 0.3, cloudNoise );

				// Fade clouds near horizon (adjusted by elevation)
				float horizonFade = smoothstep( 0.0, 0.1 + 0.2 * cloudElevation, direction.y );
				cloudMask *= horizonFade;

				// Cloud lighting based on sun position
				float sunInfluence = dot( direction, vSunDirection ) * 0.5 + 0.5;
				float daylight = max( 0.0, vSunDirection.y * 2.0 );

				// Base cloud color affected by atmosphere
				vec3 atmosphereColor = Lin * 0.04;
				vec3 cloudColor = mix( vec3( 0.3 ), vec3( 1.0 ), daylight );
				cloudColor = mix( cloudColor, atmosphereColor + vec3( 1.0 ), sunInfluence * 0.5 );
				cloudColor *= vSunE * 0.00002;

				// Blend clouds with sky
				texColor = mix( texColor, cloudColor, cloudMask * cloudDensity );

			}

			gl_FragColor = vec4( texColor, 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};function K(e,t){let n=Math.sin(e*127.1+t*311.7)*43758.5453123;return n-Math.floor(n)}function Te(e,t){let n=Math.floor(e),r=Math.floor(t),i=e-n,a=t-r;return i=i*i*(3-2*i),a=a*a*(3-2*a),T.lerp(T.lerp(K(n,r),K(n+1,r),i),T.lerp(K(n,r+1),K(n+1,r+1),i),a)}function q(e,t){let n=0,r=.5;for(let i=0;i<5;i++)n+=Te(e,t)*r,e=e*2.03+17.1,t=t*2.03+9.2,r*=.5;return n}function Ee(e,t,n=!1){let r=new g(e,t,t,z);return r.wrapS=r.wrapT=re,r.magFilter=u,r.minFilter=C,r.generateMipmaps=!0,r.anisotropy=8,n&&(r.colorSpace=me),r.needsUpdate=!0,r}function De(e){let t=new Uint8Array(262144),n=new Uint8Array(262144),r=new Uint8Array(262144),i=new Float32Array(65536);for(let n=0;n<256;n++)for(let a=0;a<256;a++){let o=n*256+a,s=o*4,c=K(a,n),l=(Math.sin(Math.PI*a/256)*Math.sin(Math.PI*n/256))**.5,u=.5+(q(a/23,n/23)-.5)*l,d=.5+(q(a/84,n/84)-.5)*l,f=u*.7+c*.08,p=160,m=160,h=148;if(e===`stone`){let e=Math.floor(n/16),t=(a+e%2*16)%32,r=n%16,i=t<.65+c*.3||t>31.35||r<.65+c*.3||r>15.35,o=K(Math.floor((a+e%2*16)/32),e),s=(i?.51:.65+o*.23)*(.79+u*.25+d*.14)+(c-.5)*.16;p=s*205,m=s*202,h=s*185,f=(i?.29:.65+o*.12)+u*.2+c*.09}else if(e===`rock`){let e=q(a/12,n/12)*l,t=.49+u*.32+e*.08;p=t*131,m=t*143,h=t*142,f=u*.6+e*.27+c*.1}else{let e=.6+u*.5+c*.11;p=e*108,m=e*124,h=e*58,f=u*.65+c*.35}t[s]=p,t[s+1]=m,t[s+2]=h,t[s+3]=255,i[o]=f;let g=e===`stone`?175+d*67:215+d*36;r[s]=r[s+1]=r[s+2]=g,r[s+3]=255}let a=new H;for(let e=0;e<256;e++)for(let t=0;t<256;t++){let r=(n,r)=>i[(e+r+256)%256*256+(t+n+256)%256];a.set((r(-1,0)-r(1,0))*1.7,(r(0,-1)-r(0,1))*1.7,1).normalize();let o=(e*256+t)*4;n[o]=(a.x*.5+.5)*255,n[o+1]=(a.y*.5+.5)*255,n[o+2]=(a.z*.5+.5)*255,n[o+3]=255}return{map:Ee(t,256,!0),normalMap:Ee(n,256),roughnessMap:Ee(r,256)}}function Oe(){let e=De(`stone`),t=De(`rock`),n=De(`grass`),r={stone:new E({...e,color:13223865,roughness:.9,normalScale:new k(.48,.48)}),path:new E({...e,color:12104608,roughness:.96,normalScale:new k(.62,.62)}),limestone:new E({...e,color:14802377,roughness:.86,normalScale:new k(.28,.28)}),rock:new E({...t,color:9213585,roughness:1,normalScale:new k(1.05,1.05)}),grass:new E({...n,color:9083492,roughness:1,normalScale:new k(.3,.3)}),bronze:new E({color:5402473,roughness:.57,metalness:.64}),gold:new E({color:12360541,roughness:.46,metalness:.72}),window:new E({color:1583664,roughness:.25,metalness:.35,emissive:8940602,emissiveIntensity:.055,side:2}),foliage:new E({color:4808509,roughness:1}),bark:new E({...t,color:7496269,roughness:1})};return{...r,dispose(){for(let e of Object.values(r))e.dispose();for(let r of[e,t,n])for(let e of Object.values(r))e.dispose()}}}function ke(e=0){let t=new Uint8Array(65536),n=(t,n)=>Math.sin((t*4+n*2)*Math.PI*2/128+e)*.55+Math.sin((t*9-n*7)*Math.PI*2/128+e*1.3)*.22+Math.cos((t*17+n*13)*Math.PI*2/128)*.1,r=new H;for(let e=0;e<128;e++)for(let i=0;i<128;i++){r.set((n(i-1,e)-n(i+1,e))*.7,(n(i,e-1)-n(i,e+1))*.7,1).normalize();let a=(e*128+i)*4;t[a]=(r.x*.5+.5)*255,t[a+1]=(r.y*.5+.5)*255,t[a+2]=(r.z*.5+.5)*255,t[a+3]=255}return Ee(t,128)}var Ae=class e extends p{constructor(t,r={}){super(t),this.isReflector=!0,this.type=`Reflector`,this.forceUpdate=!1,this._reflectionCameras=new WeakMap;let i=this,o=r.color===void 0?new V(8355711):new V(r.color),s=r.textureWidth||512,c=r.textureHeight||512,u=r.clipBias||0,f=r.shader||e.ReflectorShader,p=r.multisample===void 0?4:r.multisample,m=new n,h=new H,g=new H,_=new H,v=new l,y=new H(0,0,-1),b=new x,S=new H,C=new H,w=new x,T=new l,ee=new a(s,c,{samples:p,type:d}),E=new B({name:f.name===void 0?`unspecified`:f.name,uniforms:U.clone(f.uniforms),fragmentShader:f.fragmentShader,vertexShader:f.vertexShader});E.uniforms.tDiffuse.value=ee.texture,E.uniforms.color.value=o,E.uniforms.textureMatrix.value=T,this.material=E,this.onBeforeRender=function(e,t,n){let r=this.getReflectionCamera(n);if(g.setFromMatrixPosition(i.matrixWorld),_.setFromMatrixPosition(n.matrixWorld),v.extractRotation(i.matrixWorld),h.set(0,0,1),h.applyMatrix4(v),S.subVectors(g,_),S.dot(h)>0&&this.forceUpdate===!1)return;S.reflect(h).negate(),S.add(g),v.extractRotation(n.matrixWorld),y.set(0,0,-1),y.applyMatrix4(v),y.add(_),C.subVectors(g,y),C.reflect(h).negate(),C.add(g),r.position.copy(S),r.up.set(0,1,0),r.up.applyMatrix4(v),r.up.reflect(h),r.lookAt(C),r.far=n.far,r.updateMatrixWorld(),r.projectionMatrix.copy(n.projectionMatrix),T.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),T.multiply(r.projectionMatrix),T.multiply(r.matrixWorldInverse),T.multiply(i.matrixWorld),m.setFromNormalAndCoplanarPoint(h,g),m.applyMatrix4(r.matrixWorldInverse),b.set(m.normal.x,m.normal.y,m.normal.z,m.constant);let a=r.projectionMatrix;r.isOrthographicCamera?(w.x=(Math.sign(b.x)+a.elements[8])/a.elements[0],w.y=(Math.sign(b.y)+a.elements[9])/a.elements[5],w.z=-n.far,w.w=1):(w.x=(Math.sign(b.x)+a.elements[8])/a.elements[0],w.y=(Math.sign(b.y)+a.elements[9])/a.elements[5],w.z=-1,w.w=(1+a.elements[10])/a.elements[14]),b.multiplyScalar(2/b.dot(w)),a.elements[2]=b.x,a.elements[6]=b.y,r.isOrthographicCamera?(a.elements[10]=b.z-u,a.elements[14]=b.w-1):(a.elements[10]=b.z+1-u,a.elements[14]=b.w),i.visible=!1;let o=e.getRenderTarget(),s=e.xr.enabled,c=e.shadowMap.autoUpdate;e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(ee),e.state.buffers.depth.setMask(!0),e.autoClear===!1&&e.clear(),e.render(t,r),e.xr.enabled=s,e.shadowMap.autoUpdate=c,e.setRenderTarget(o);let l=n.viewport;l!==void 0&&e.state.viewport(l),i.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return ee},this.dispose=function(){ee.dispose(),i.material.dispose()},this.getReflectionCamera=function(e){let t=this._reflectionCameras.get(e);return t===void 0&&(t=e.clone(),this._reflectionCameras.set(e,t)),t}}};Ae.ReflectorShader={name:`ReflectorShader`,uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
		uniform mat4 textureMatrix;
		varying vec4 vUv;

		#include <common>
		#include <logdepthbuf_pars_vertex>

		void main() {

			vUv = textureMatrix * vec4( position, 1.0 );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			#include <logdepthbuf_vertex>

		}`,fragmentShader:`
		uniform vec3 color;
		uniform sampler2D tDiffuse;
		varying vec4 vUv;

		#include <logdepthbuf_pars_fragment>

		float blendOverlay( float base, float blend ) {

			return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

		}

		vec3 blendOverlay( vec3 base, vec3 blend ) {

			return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );

		}

		void main() {

			#include <logdepthbuf_fragment>

			vec4 base = texture2DProj( tDiffuse, vUv );
			gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};var je=class e extends p{constructor(t,r={}){super(t),this.isRefractor=!0,this.type=`Refractor`,this.camera=new v;let i=this,o=r.color===void 0?new V(8355711):new V(r.color),s=r.textureWidth||512,c=r.textureHeight||512,u=r.clipBias||0,f=r.shader||e.RefractorShader,p=r.multisample===void 0?4:r.multisample,m=this.camera;m.matrixAutoUpdate=!1,m.userData.refractor=!0;let h=new n,g=new l,_=new a(s,c,{samples:p,type:d});this.material=new B({name:f.name===void 0?`unspecified`:f.name,uniforms:U.clone(f.uniforms),vertexShader:f.vertexShader,fragmentShader:f.fragmentShader,transparent:!0}),this.material.uniforms.color.value=o,this.material.uniforms.tDiffuse.value=_.texture,this.material.uniforms.textureMatrix.value=g;let y=(function(){let e=new H,t=new H,n=new l,r=new H,a=new H;return function(o){return e.setFromMatrixPosition(i.matrixWorld),t.setFromMatrixPosition(o.matrixWorld),r.subVectors(e,t),n.extractRotation(i.matrixWorld),a.set(0,0,1),a.applyMatrix4(n),r.dot(a)<0}})(),b=(function(){let e=new H,t=new H,n=new R,r=new H;return function(){i.matrixWorld.decompose(t,n,r),e.set(0,0,1).applyQuaternion(n).normalize(),e.negate(),h.setFromNormalAndCoplanarPoint(e,t)}})(),S=(function(){let e=new n,t=new x,r=new x;return function(n){m.matrixWorld.copy(n.matrixWorld),m.matrixWorldInverse.copy(m.matrixWorld).invert(),m.projectionMatrix.copy(n.projectionMatrix),m.far=n.far,e.copy(h),e.applyMatrix4(m.matrixWorldInverse),t.set(e.normal.x,e.normal.y,e.normal.z,e.constant);let i=m.projectionMatrix;r.x=(Math.sign(t.x)+i.elements[8])/i.elements[0],r.y=(Math.sign(t.y)+i.elements[9])/i.elements[5],r.z=-1,r.w=(1+i.elements[10])/i.elements[14],t.multiplyScalar(2/t.dot(r)),i.elements[2]=t.x,i.elements[6]=t.y,i.elements[10]=t.z+1-u,i.elements[14]=t.w}})();function C(e){g.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),g.multiply(e.projectionMatrix),g.multiply(e.matrixWorldInverse),g.multiply(i.matrixWorld)}function w(e,t,n){i.visible=!1;let r=e.getRenderTarget(),a=e.xr.enabled,o=e.shadowMap.autoUpdate;e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(_),e.autoClear===!1&&e.clear(),e.render(t,m),e.xr.enabled=a,e.shadowMap.autoUpdate=o,e.setRenderTarget(r);let s=n.viewport;s!==void 0&&e.state.viewport(s),i.visible=!0}this.onBeforeRender=function(e,t,n){n.userData.refractor!==!0&&y(n)&&(b(),C(n),S(n),w(e,t,n))},this.getRenderTarget=function(){return _},this.dispose=function(){_.dispose(),i.material.dispose()}}};je.RefractorShader={name:`RefractorShader`,uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`

		uniform mat4 textureMatrix;

		varying vec4 vUv;

		void main() {

			vUv = textureMatrix * vec4( position, 1.0 );
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform vec3 color;
		uniform sampler2D tDiffuse;

		varying vec4 vUv;

		float blendOverlay( float base, float blend ) {

			return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

		}

		vec3 blendOverlay( vec3 base, vec3 blend ) {

			return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );

		}

		void main() {

			vec4 base = texture2DProj( tDiffuse, vUv );
			gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};function Me(e){let t=new ie(3100,2850),n=new Ae(t,{textureWidth:512,textureHeight:512,clipBias:.002,multisample:0}),r=new je(t,{textureWidth:512,textureHeight:512,clipBias:.002,multisample:0}),i=[ke(),ke(2.7)],a=new l,o={...U.clone(te.fog),reflectionMap:{value:n.getRenderTarget().texture},refractionMap:{value:r.getRenderTarget().texture},normalA:{value:i[0]},normalB:{value:i[1]},textureMatrix:{value:a},time:{value:0},tint:{value:new V(7050900)}},s=new B({name:`AincradLakeReflectionRefraction`,uniforms:o,fog:!0,vertexShader:`
      #include <common>
      #include <fog_pars_vertex>
      varying vec4 vProjected;
      varying vec2 vLakeUv;
      varying vec3 vEye;
      uniform mat4 textureMatrix;
      void main() {
        vLakeUv = uv;
        vProjected = textureMatrix * vec4(position, 1.0);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vEye = cameraPosition - world.xyz;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,fragmentShader:`
      #include <common>
      #include <fog_pars_fragment>
      varying vec4 vProjected;
      varying vec2 vLakeUv;
      varying vec3 vEye;
      uniform sampler2D reflectionMap;
      uniform sampler2D refractionMap;
      uniform sampler2D normalA;
      uniform sampler2D normalB;
      uniform float time;
      uniform vec3 tint;
      void main() {
        vec3 a = texture2D(normalA, vLakeUv * 34.0 + vec2(time * 0.003, time * 0.001)).xyz * 2.0 - 1.0;
        vec3 b = texture2D(normalB, vLakeUv * 57.0 + vec2(-time * 0.002, time * 0.002)).xyz * 2.0 - 1.0;
        vec3 normal = normalize(vec3((a.x + b.x) * 0.3, 1.0, (a.y + b.y) * 0.3));
        vec3 eye = normalize(vEye);
        float fresnel = 0.055 + 0.945 * pow(1.0 - max(dot(eye, normal), 0.0), 5.0);
        vec2 projected = vProjected.xy / vProjected.w;
        vec2 offset = normal.xz * 0.0045;
        vec2 refractUv = clamp(projected + offset, vec2(0.002), vec2(0.998));
        vec2 reflectUv = clamp(vec2(1.0 - projected.x, projected.y) + offset, vec2(0.002), vec2(0.998));
        vec3 reflected = texture2D(reflectionMap, reflectUv).rgb;
        vec3 refracted = texture2D(refractionMap, refractUv).rgb;
        refracted = mix(refracted, tint * 0.29, 0.46);
        vec3 water = mix(refracted, reflected, max(fresnel, 0.26));
        vec3 sunDirection = normalize(vec3(-0.7, 0.53, 0.48));
        vec3 halfway = normalize(eye + sunDirection);
        float glint = pow(max(dot(normal, halfway), 0.0), 240.0);
        water += vec3(1.0, 0.88, 0.64) * glint * 1.4;
        gl_FragColor = vec4(water, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`}),c=new p(t,s);c.name=`Aincrad alpine lake · reflected and refracted`,c.rotation.x=-Math.PI/2,c.position.set(0,-205,470),c.renderOrder=1,e.add(c),n.matrixAutoUpdate=r.matrixAutoUpdate=!1;let u=!0,d=!1,f=new x,m=new x;return c.onBeforeRender=(...e)=>{if(!u||d)return;let[i,o,s]=e;if(s.position.y<c.position.y)return;d=!0,i.getViewport(f),i.getScissor(m);let l=i.getScissorTest(),p=i.getRenderTarget(),h=c.visible;try{a.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),a.multiply(s.projectionMatrix).multiply(s.matrixWorldInverse).multiply(c.matrixWorld),c.visible=!1,n.matrixWorld.copy(c.matrixWorld),r.matrixWorld.copy(c.matrixWorld),i.setScissorTest(!1),n.onBeforeRender(i,o,s,t,n.material,e[5]),r.onBeforeRender(i,o,s,t,r.material,e[5])}finally{c.visible=h,i.setRenderTarget(p),i.setViewport(f),i.setScissor(m),i.setScissorTest(l),d=!1}},{mesh:c,update(e){o.time.value=e},setQuality(e,t){let i=e&&!t?768:384;n.getRenderTarget().setSize(i,i),r.getRenderTarget().setSize(i,i)},setEnabled(e){u=e},dispose(){c.onBeforeRender=()=>{},e.remove(c),n.dispose(),r.dispose(),i.forEach(e=>e.dispose()),s.dispose(),t.dispose()}}}var J=Math.PI*2,Ne=T.clamp,Pe=Array.from({length:19},(e,t)=>{let n=t/19*J,r=2750+K(t,21)*1450;return{x:Math.cos(n)*r,z:Math.sin(n)*r,height:520+K(t,74)*1350,width:450+K(t,28)*530}});function Fe(e,t){let n=q(e/700+11,t/700+8),r=q(e/180-7,t/180+20),i=Math.hypot(e/1330,(t-440)/1310),a=T.smoothstep(i,.67,1.12),o=T.lerp(-86+r*19,-1+n*24+r*7,a);for(let n of Pe){let r=(e-n.x)/n.width,i=(t-n.z)/n.width,a=Math.max(0,1-Math.hypot(r,i)/1.7);o+=n.height*a*a*(.6+q(e/340,t/340)*.78)}return o-180}function Y(e,t,n,i,a=!1){let o=new r(e,t,n);return o.castShadow=a,o.receiveShadow=!0,i.add(o),o}function X(e,t,n,r,i,a=1,o=1,s=1,c=0,u=0){let d=new l().compose(new H(n,r,i),new R().setFromEuler(new F(0,c,u)),new H(a,o,s));e.setMatrixAt(t,d)}function Ie(e,t,n){let r=e.getAttribute(`uv`);for(let e=0;e<r.count;e++)r.setXY(e,r.getX(e)*t,r.getY(e)*n);return e}function Le(){let e=new j;return e.moveTo(-.5,0),e.lineTo(.5,0),e.lineTo(.5,.63),e.quadraticCurveTo(.5,.9,0,1.18),e.quadraticCurveTo(-.5,.9,-.5,.63),e.closePath(),new ae(e,3)}function Re(){let e=new Uint8Array(65536);for(let t=0;t<128;t++)for(let n=0;n<128;n++){let r=(n/128-.5)*2,i=(t/128-.5)*2,a=Math.max(0,1-r*r-i*i*1.6),o=q(n/26,t/26),s=Ne((a*(.4+o)-.14)*1.85,0,1),c=206+Ne(i*29+o*35,0,49),l=(t*128+n)*4;e[l]=c,e[l+1]=Math.min(255,c+4),e[l+2]=Math.min(255,c+8),e[l+3]=s*205}let t=new g(e,128,128,z);return t.colorSpace=me,t.magFilter=u,t.minFilter=C,t.generateMipmaps=!0,t.needsUpdate=!0,t}function ze(){let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`);t.fillStyle=`black`,t.fillRect(0,0,128,128),t.fillStyle=`white`;for(let e=0;e<17;e++){let n=20+K(e,71)*88,r=n+(K(e,75)-.5)*49,i=24+K(e,79)*103;t.beginPath(),t.moveTo(n-2,128),t.quadraticCurveTo(n-3,128-i*.62,r,128-i),t.quadraticCurveTo(n+3,128-i*.56,n+2,128),t.fill()}let n=new ye(e);return n.anisotropy=4,n}function Be(e,t){let n=new c;n.name=`Aincrad · one hundred floating floors`,e.add(n);let i=new c;i.name=`Broad floating fortress silhouette`,i.scale.set(2.2,1,2.2),n.add(i);let a=new Set,l=new Set,u=Oe();for(let t of[...e.children])(t instanceof w||t.name===`Aincrad sun target`)&&e.remove(t);e.background=new V(10995668),e.fog=new _(10399671,6e-5);let d=new we;d.name=`Aincrad atmospheric scattering`,d.scale.setScalar(7e3);let f=new H(-.7,.53,.48).normalize(),h=d.material.uniforms;h.turbidity.value=2.6,h.rayleigh.value=2.1,h.mieCoefficient.value=.003,h.mieDirectionalG.value=.76,h.cloudCoverage.value=.24,h.cloudDensity.value=.22,h.sunPosition.value.copy(f),d.material.fragmentShader=d.material.fragmentShader.replace(`gl_FragColor = vec4( texColor, 1.0 );`,`float skyLuminance = dot(texColor, vec3(0.2126, 0.7152, 0.0722));
     texColor *= 1.02 / (1.0 + skyLuminance);
     gl_FragColor = vec4(texColor, 1.0);`),n.add(d);let g=new le,v=d.clone();v.material=d.material.clone(),g.add(v);let b=new oe(t),x=b.fromScene(g,.015,.1,1e4);b.dispose(),v.material.dispose(),e.environment=x.texture,e.environmentIntensity=.32;let S=new m(11916517,3621163,.37);n.add(S);let C=new I(16769716,3.2);C.name=`Aincrad near-camera sunlight`,C.castShadow=!0,C.shadow.mapSize.set(2048,2048),Object.assign(C.shadow.camera,{left:-56,right:56,top:56,bottom:-56,near:.5,far:520}),C.shadow.bias=-15e-6,C.shadow.normalBias=.018,C.shadow.radius=1.3,n.add(C),n.add(C.target);let ee=new I(11916519,.16);ee.position.set(400,170,700),n.add(ee);let D=540/100,te=Y(Ie(new o(1,1,1,96,1,!0),160,.55),u.stone,100,i,!0);te.name=`100 inhabited stone floor bands`;let ne=Y(new o(1,1.004,1,96,1,!0),u.limestone,100,i,!0),re=new de(.958,1,96);re.rotateX(-Math.PI/2);let O=u.stone.clone();O.side=2,l.add(O);let k=Y(re,O,100,i),A=Y(re,u.grass,10,i),j=Y(new o(1,1,1,96,1,!0),u.rock,100,i),ae=Y(Le(),u.window,5600,i),se=Y(new _e(1,1,1),u.limestone,2800,i,!0);for(let e=0;e<100;e++){let t=80+e*D,n=220-e/100*135;X(te,e,0,t+D/2,0,n,4.78,n),X(ne,e,0,t+.12,0,n+(e%10==0?6.1:4.2),e%10==0?1.65:1.04,n+(e%10==0?6.1:4.2)),X(k,e,0,t+.68,0,n+4.1,1,n+4.1),e%10==0&&X(A,e/10,0,t+.72,0,n+4.05,1,n+4.05),X(j,e,0,t-.65,0,n+1.5,.65,n+1.5),te.setColorAt(e,new V().setHSL(.12,.035,.83+K(e,17)*.13));for(let r=0;r<56;r++){let i=r/56*J+e%2*J/56/2;X(ae,e*56+r,Math.sin(i)*(n+.06),t+1.45,Math.cos(i)*(n+.06),1.1,2.1,1,i)}for(let r=0;r<28;r++){let i=r/28*J;X(se,e*28+r,Math.sin(i)*(n+.45),t+2.4,Math.cos(i)*(n+.45),.75,4.25,1.25,i)}}let ce=new o(226,24,155,96,12,!1),P=ce.getAttribute(`position`),F=new Float32Array(P.count*3);for(let e=0;e<P.count;e++){let t=P.getX(e),n=P.getY(e),r=P.getZ(e),i=Math.atan2(r,t),a=Ne((n+77.5)/155,0,1),o=.91+q(i*8+40,n/17)*.16;P.setXYZ(e,t*o,n+(q(t/22,r/22)-.5)*17*(1-a),r*o);let s=.61+a*.28+K(e,4)*.08;F[e*3]=s*.89,F[e*3+1]=s,F[e*3+2]=s*.96}ce.computeVertexNormals(),ce.setAttribute(`color`,new be(F,3));let L=u.rock.clone();L.vertexColors=!0,l.add(L);let R=new p(ce,L);R.position.y=-1,R.castShadow=R.receiveShadow=!0,i.add(R);let pe=new s(1,1,7,5),z=pe.getAttribute(`position`);for(let e=0;e<z.count;e++){let t=z.getX(e),n=z.getY(e),r=z.getZ(e),i=.65+K(Math.round(t*17+n*13),Math.round(r*19-n*15))*.59;z.setXYZ(e,t*i+n*.12,n+K(Math.round(t*7),Math.round(r*7))*.1,r*i)}pe.computeVertexNormals();let me=Y(pe,u.rock,64,i,!0);for(let e=0;e<64;e++){let t=e/64*J,n=85+K(e,3)*110,r=30-(220-n)*.35;X(me,e,Math.cos(t)*n,r-33,Math.sin(t)*n,6+K(e,41)*12,-(40+K(e,37)*57),8+K(e,16)*13,t,.1)}let he=new p(new o(224,230,12,96),u.limestone);he.position.y=75,he.castShadow=he.receiveShadow=!0,i.add(he);let ge=Y(new _e(1,1,1),u.stone,48,i,!0),B=Y(new s(1,1,4),u.bronze,48,i,!0);for(let e=0;e<48;e++){let t=e/48*J;X(ge,e,Math.sin(t)*222,66,Math.cos(t)*222,6,31,8,t),X(B,e,Math.sin(t)*222,87,Math.cos(t)*222,6,14,6,t+Math.PI/4)}let ve=Y(new o(1,1.08,1,12),u.limestone,30,i,!0),ye=Y(new s(1,1,12),u.bronze,30,i,!0);for(let e=0;e<30;e++){let t=9+Math.floor(e/6)*17,n=80+t*D,r=e%6/6*J+Math.floor(e/6)*.24,i=220-t/100*135;X(ve,e,Math.sin(r)*(i-1.5),n+5,Math.cos(r)*(i-1.5),4.8,12,4.8),X(ye,e,Math.sin(r)*(i-1.5),n+14.5,Math.cos(r)*(i-1.5),5.8,10,5.8)}let U=new c;U.position.y=620,U.scale.y=1.3,i.add(U);let xe=new Map,W=(e,t,n,r,i,a=0)=>{let o=e.index?e.toNonIndexed():e.clone();o.rotateY(a),o.translate(n,r,i),e.dispose();let s=xe.get(t)??[];s.push(o),xe.set(t,s)};W(new o(85,89,5,96),u.limestone,0,-2,0),W(new o(81,82,.5,96),u.grass,0,.8,0),W(new o(39,43,25,12),u.stone,0,13,0),W(new o(40,42,1.3,12),u.limestone,0,27,0),W(new s(44,24,12),u.bronze,0,39,0),W(new o(12,16,43,12),u.limestone,0,47,0),W(new s(17,29,12),u.bronze,0,83,0),W(new s(1.1,11,8),u.gold,0,103,0);for(let e=0;e<12;e++){let t=e/12*J,n=e%2?64:53,r=e%2?21:35;if(W(new o(4.4,6.5,r,10),u.limestone,Math.sin(t)*n,r/2,Math.cos(t)*n),W(new s(7.1,21,10),u.bronze,Math.sin(t)*n,r+10,Math.cos(t)*n),W(new fe(.85,8,6),u.gold,Math.sin(t)*n,r+21,Math.cos(t)*n),e%2==0){W(new _e(10,17,31),u.stone,Math.sin(t)*36,10,Math.cos(t)*36,t);let e=new o(0,9,18,3,1);e.rotateX(Math.PI/2),e.scale(1,1.6,1),W(e,u.bronze,Math.sin(t)*36,21,Math.cos(t)*36,t)}}for(let[e,t]of xe){let n=M(t);if(t.forEach(e=>e.dispose()),n){let t=new p(n,e);t.castShadow=t.receiveShadow=!0,U.add(t)}}let Se=Y(Le(),u.window,48,U);for(let e=0;e<48;e++){let t=e/24*J,n=e<24?40.7:14.3;X(Se,e,Math.sin(t)*n,e<24?11:44,Math.cos(t)*n,e<24?2.8:1.8,6.5,1,t)}let G=new ie(9800,9800,180,180);G.rotateX(-Math.PI/2);let Ce=G.getAttribute(`position`),Te=new Float32Array(Ce.count*3),Ee=new V(7438672),De=new V(7832454),ke=new V(13951712),Ae=new V;for(let e=0;e<Ce.count;e++){let t=Ce.getX(e),n=Ce.getZ(e),r=Fe(t,n);Ce.setY(e,r);let i=Math.hypot(Fe(t+18,n)-r,Fe(t,n+18)-r)/18;Ae.copy(Ee).lerp(De,Ne(i*.75+(r-210)/850,0,1)),Ae.lerp(ke,T.smoothstep(r+q(t/130,n/130)*130,920,1260)*Ne(1.3-i*.42,0,1)),Ae.multiplyScalar(.83+q(t/120,n/120)*.3),Te[e*3]=Ae.r,Te[e*3+1]=Ae.g,Te[e*3+2]=Ae.b}G.setAttribute(`color`,new be(Te,3)),G.computeVertexNormals(),Ie(G,580,580);let je=u.rock.clone();je.color.set(16777215),je.vertexColors=!0,je.normalScale.set(.11,.11),l.add(je);let Pe=new p(G,je);Pe.name=`Alpine grasslands, rocky ridges and snow`,Pe.receiveShadow=!0,n.add(Pe);let Be=new ie(820,640,75,65);Be.rotateX(-Math.PI/2),Be.translate(1050,0,1460);let Ve=Be.getAttribute(`position`);for(let e=0;e<Ve.count;e++)Ve.setY(e,Fe(Ve.getX(e),Ve.getZ(e))+.15);Be.computeVertexNormals(),Ie(Be,120,92);let He=new p(Be,u.grass);He.receiveShadow=!0,n.add(He);let Ue=new ie(1.25,1.1,1,3);Ue.translate(0,.55,0);let We={value:0},Ge=new E({color:9741407,roughness:1,side:2,alphaTest:.46}),Ke=ze();a.add(Ke),Ge.alphaMap=Ke,l.add(Ge),Ge.onBeforeCompile=e=>{e.uniforms.aincradWindTime=We,e.vertexShader=`uniform float aincradWindTime;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
      vec3 bladeWorld = (instanceMatrix * vec4(position, 1.0)).xyz;
      transformed.x += sin(aincradWindTime * 1.35 + bladeWorld.x * 0.035 + bladeWorld.z * 0.06) * position.y * position.y * 0.23;
      transformed.z += cos(aincradWindTime * 0.85 + bladeWorld.z * 0.05) * position.y * 0.09;`)},Ge.customProgramCacheKey=()=>`aincrad-grass-wind-v1`;let Z=Y(Ue,Ge,14e3,n);Z.name=`Wind-swept foreground grasses`;for(let e=0;e<Z.count;e++){let t=920+K(e,12)*310,n=1280+K(e,15)*320,r=.5+K(e,34)*1.2;X(Z,e,t,Fe(t,n)+.16,n,r,r,r,K(e,32)*J),Z.setColorAt(e,new V().setHSL(.18+K(e,54)*.03,.22,.6+K(e,64)*.3))}let qe=new y(1,1),Q=qe.getAttribute(`position`);for(let e=0;e<Q.count;e++){let t=.77+K(e,17)*.36;Q.setXYZ(e,Q.getX(e)*t,Q.getY(e)*t,Q.getZ(e)*t)}qe.computeVertexNormals();let Je=Y(qe,u.rock,85,n,!0),Ye=Y(new o(.15,.3,1,6),u.bark,180,n,!0),Xe=Y(new s(1,1,7,3),u.foliage,540,n,!0);for(let e=0;e<180;e++){let t=K(e,57)*J,n=1580+K(e,59)*800,r=Math.sin(t)*n,i=Math.cos(t)*n,a=Fe(r,i),o=10+K(e,62)*18;X(Ye,e,r,a+o*.22,i,o*.08,o*.44,o*.08);for(let n=0;n<3;n++)X(Xe,e*3+n,r,a+o*(.38+n*.2),i,o*(.25-n*.045),o*.5,o*(.25-n*.045),t)}for(let e=0;e<Je.count;e++){let t=680+K(e,91)*880,n=1100+K(e,85)*720,r=.45+K(e,88)*5;X(Je,e,t,Fe(t,n)+r*.36,n,r*1.4,r*.75,r,K(e,39)*J)}let Ze=Re();a.add(Ze);let Qe=new N({map:Ze,transparent:!0,opacity:.33,depthWrite:!1,fog:!0,color:15921381});l.add(Qe);let $e=[];for(let e=0;e<42;e++){let t=e/42*J,r=e>=22,i=r?1100+K(e,10)*1350:540+K(e,51)*310,a=new ue(Qe);a.position.set(Math.cos(t)*i,r?160+K(e,47)*280:-70+K(e,46)*110,Math.sin(t)*i);let o=r?620+K(e,76)*500:240+K(e,77)*200;a.scale.set(o,o*.38,1),n.add(a),$e.push({sprite:a,origin:a.position.clone(),phase:t})}let et=Me(e),tt=!1,nt=new H,rt=f.clone().multiplyScalar(175);return{sun:C,materials:u,trackMaterial:u.path,update(e,t){We.value=e,et.update(e);for(let{sprite:t,origin:n,phase:r}of $e)t.position.x=n.x+Math.sin(e*.013+r)*12,t.position.y=n.y+Math.sin(e*.025+r*2)*3},prepareCamera(e){e.getWorldPosition(nt);let t=Math.hypot(nt.x,nt.z)>760;t?(C.target.position.set(0,295,0),C.position.copy(C.target.position).addScaledVector(f,1650)):(C.position.copy(nt).add(rt),C.target.position.copy(nt));let n=t?680:34,r=C.shadow.camera;r.left=r.bottom=-n,r.right=r.top=n,r.far=t?3e3:360,C.shadow.bias=t?-45e-6:-15e-6,r.updateProjectionMatrix(),C.target.updateMatrixWorld(),C.updateMatrixWorld()},setQuality(e,t){et.setQuality(e,t),Z.visible=e,C.shadow.mapSize.set(e?2048:1024,e?2048:1024),C.shadow.map&&(C.shadow.map.dispose(),C.shadow.map=null)},dispose(){if(tt)return;tt=!0,et.dispose(),x.dispose(),e.environment=null;let t=new Set;n.traverse(e=>{if(e instanceof p){t.add(e.geometry),e instanceof r&&e.dispose();for(let t of Array.isArray(e.material)?e.material:[e.material])l.add(t)}}),C.shadow.dispose(),t.forEach(e=>e.dispose()),l.forEach(e=>e.dispose()),a.forEach(e=>e.dispose()),u.dispose(),n.removeFromParent(),n.clear()}}}function Ve(e){if(e.userData.aincradMetricUV)return;e.userData.aincradMetricUV=!0;let t=e.onBeforeCompile,n=e.customProgramCacheKey.bind(e)();e.onBeforeCompile=(n,r)=>{t.call(e,n,r),n.vertexShader=n.vertexShader.replace(`#include <common>`,`#include <common>
attribute vec3 courseScale;`).replace(`#include <uv_vertex>`,`#include <uv_vertex>
      vec2 courseRepeat = (abs(normal.y)>0.5 ? courseScale.xz : (abs(normal.x)>0.5 ? courseScale.zy : courseScale.xy)) / vec2(4.0,4.8);
      #ifdef USE_MAP
        vMapUv *= courseRepeat;
      #endif
      #ifdef USE_NORMALMAP
        vNormalMapUv *= courseRepeat;
      #endif
      #ifdef USE_ROUGHNESSMAP
        vRoughnessMapUv *= courseRepeat;
      #endif`)},e.customProgramCacheKey=()=>`${n}|aincrad-metric-stone-v1`,e.needsUpdate=!0}function He(e){let t=``;for(let[n,r]of[[100,`C`],[90,`XC`],[50,`L`],[40,`XL`],[10,`X`],[9,`IX`],[5,`V`],[4,`IV`],[1,`I`]])for(;e>=n;)t+=r,e-=n;return t}function Ue(n,i,a){let s=new c;s.name=`Aincrad exterior spiral course`,s.userData.turns=Se.turns,s.userData.routeSegments=W,i.add(s);let u=new _e(1,1,1);Ve(a);let d=new E({color:4743006,metalness:.68,roughness:.52}),m=new E({color:11650237,metalness:.62,roughness:.42}),h=new E({color:14083792,emissive:10999229,emissiveIntensity:.8,roughness:.28}),g=new Map;for(let[e,t]of[[a,`Instanced stone deck and balustrades`],[d,`Instanced patinated lantern frames`],[m,`Instanced silver route inlays`],[h,`Instanced lantern glass`]])g.set(e,{material:e,name:t,matrices:[],sizes:[],colors:[]});let _=new l,v=new H,y=new H,b=new R,x=new R,S=new R,C=new V(1,1,1),w=(e,t,n,r=S,i=C)=>{let a=g.get(e);y.set(...n),a.matrices.push(_.compose(t,r,y).clone()),a.sizes.push(...n),a.colors.push(i.clone())},D=(e,t,n,r,i,a)=>{v.set(...r).applyQuaternion(n).add(t),x.copy(n),a&&x.multiply(a),w(e,v,i,x)},te=(r,i,a=S)=>n.createCollider(e.ColliderDesc.cuboid(i[0]/2,i[1]/2,i[2]/2).setTranslation(r.x,r.y,r.z).setRotation(a).setFriction(.65).setCollisionGroups(t.terrain)),re=Ce.obstacles.map(e=>{let t=ce(n,i,{...e,surface:`stone`});i.remove(t.visual),t.visual.geometry.dispose();for(let e of Array.isArray(t.visual.material)?t.visual.material:[t.visual.material])e.dispose();t.visual.geometry=u,t.visual.material=a,t.visual.scale.copy(t.size),t.visual.name=`Detached static obstacle reference`,b.copy(t.body.rotation());let r=t.size,o=r.y<.9;if(w(a,t.origin,[r.x,r.y,r.z],b,o?new V(.65,.72,.69):C),o||r.x>20)return t;let s=r.x<6,c=Math.max(.2,r.z-.16);for(let e of[-1,1]){let n=e*(r.x/2-.15);D(a,t.origin,b,[n,r.y/2+.095,0],[.3,.19,c]);let i=[.3,s?.19:1.08,c];if(v.set(n,r.y/2+i[1]/2,0).applyQuaternion(b).add(t.origin),te(v,i,b),s)continue;D(a,t.origin,b,[n,r.y/2+1.04,0],[.4,.2,c]);let o=Math.max(2,Math.ceil(c/3.4));for(let e=0;e<o;e++){let i=T.lerp(-c/2+.24,c/2-.24,e/(o-1));D(a,t.origin,b,[n,r.y/2+.53,i],[.21,.88,.21]),D(a,t.origin,b,[n,r.y/2+.2,i],[.38,.19,.38])}}return t}),O=new H(0,1,0),k=new H,A=new H,j=new H,ie=new l,ae={I:[[0,-.35,0,.35]],V:[[-.2,.35,0,-.35],[0,-.35,.2,.35]],X:[[-.2,-.35,.2,.35],[-.2,.35,.2,-.35]],L:[[-.2,.35,-.2,-.35],[-.2,-.35,.2,-.35]],C:[[.2,.35,-.2,.35],[-.2,.35,-.2,-.35],[-.2,-.35,.2,-.35]]};for(let e=0;e<G.length-1;e+=8){let t=G[e];k.subVectors(G[e+1],t).normalize(),A.crossVectors(O,k).normalize();let n=k.clone().cross(A).normalize();b.setFromRotationMatrix(ie.makeBasis(A,n,k));let r=e%Se.segmentsPerTurn,i=r>=44&&r<=50?2.3:Se.width/2;j.set(t.x,0,t.z).normalize();let o=t.clone().addScaledVector(j,i-.24),s=new R().setFromAxisAngle(O,Math.atan2(-j.x,-j.z));w(a,o.clone().add(new H(0,.25,0)),[.72,.5,.72],s),w(d,o.clone().add(new H(0,1.3,0)),[.14,2.1,.14],s),w(d,o.clone().add(new H(0,2.33,0)),[.7,.12,.7],s),w(h,o.clone().add(new H(0,2.72,0)),[.43,.64,.43],s);for(let e of[-.27,.27])for(let t of[-.27,.27])D(d,o,s,[e,2.72,t],[.055,.79,.055]);if(w(d,o.clone().add(new H(0,3.11,0)),[.72,.13,.72],s),te(o.clone().add(new H(0,1.2,0)),[.45,2.4,.45],s),e%16==0){let t=He(Math.max(1,Math.round(e/W*100)));D(d,o,s,[0,1.75,.24],[Math.max(.95,t.length*.32+.2),.76,.1]);let n=.65;for(let e=0;e<t.length;e++)for(let[r,i,a,c]of ae[t[e]]){let l=a-r,u=c-i,d=new R().setFromAxisAngle(new H(0,0,1),-Math.atan2(l,u));D(m,o,s,[(e-(t.length-1)/2)*.32+(r+a)*n/2,1.75+(i+c)*n/2,.302],[.035,Math.hypot(l,u)*n,.012],d)}}if(e>0)for(let e of[-1,1]){let n=new R().setFromAxisAngle(O,e*.62);D(m,t,b,[e*.22,.021,1.4],[.085,.018,.85],n)}}for(let e of g.values()){let t=e.material===a?u:u.clone();t.setAttribute(`courseScale`,new xe(new Float32Array(e.sizes),3));let n=new r(t,e.material,e.matrices.length);n.name=e.name,n.castShadow=e.material!==h,n.receiveShadow=!0;for(let t=0;t<e.matrices.length;t++)n.setMatrixAt(t,e.matrices[t]),n.setColorAt(t,e.colors[t]);n.instanceMatrix.needsUpdate=!0,n.instanceColor&&(n.instanceColor.needsUpdate=!0),n.computeBoundingSphere(),s.add(n)}let[oe,se,M]=Ce.finish,N=new c;N.name=`Summit silver and teal crystal altar`,N.position.set(oe,se-1,M),s.add(N);let P=new E({color:8096130,roughness:.93}),F=new p(new o(2.7,2.9,.18,48),P);F.position.y=.09,F.receiveShadow=!0,N.add(F),n.createCollider(e.ColliderDesc.cylinder(.09,2.8).setTranslation(oe,se-.91,M).setCollisionGroups(t.terrain));for(let e of[1.65,2.6]){let t=new p(new ne(e,.035,6,64),m);t.rotation.x=Math.PI/2,t.position.y=.2,N.add(t)}let I=new c;I.name=`Aincrad summit crystal victory sensor`,I.position.set(oe,se,M),i.add(I);let le=new f({color:9096132,roughness:.13,metalness:.08,clearcoat:1,clearcoatRoughness:.09,emissive:2052430,emissiveIntensity:.22}),L=new p(new ee(.7),le);L.scale.set(.82,1.45,.82),L.castShadow=!0,I.add(L);let ue=new p(new ne(1.05,.035,6,64),m);ue.rotation.x=Math.PI/2+.25,I.add(ue);let de=new ge(9360583,3,10,2);return de.position.y=1,I.add(de),{obstacles:re,crown:{root:I,collider:n.createCollider(e.ColliderDesc.ball(1).setTranslation(...Ce.finish).setSensor(!0).setCollisionGroups(t.trigger))}}}var We=Math.PI*2,Ge=[1160,1530],Ke=[980,1340],Z=Math.atan2(...Ke),qe=1780,Q=e=>{let t=T.clamp(e,0,1);return t*t*t*(t*(t*6-15)+10)},Je=class{meadowHeight;duration=56;camera=new v(50,1,.5,1e4);target=new H;startPoint;elapsed=0;orbitAngle=0;currentShot=`meadow`;currentShotProgress=0;entryCamera=new H;entryTarget=new H;constructor(e=[0,80,512],t=()=>0){this.meadowHeight=t,this.startPoint=e instanceof H?e.clone():new H(...e),this.entryCamera.copy(this.startPoint).add(new H(-8,5,10)),this.entryTarget.copy(this.startPoint).add(new H(0,1,0)),this.camera.name=`Aincrad cinematic camera`,this.update(0,1)}get time(){return this.elapsed}get finished(){return this.elapsed>=this.duration}get frame(){let e={meadow:[`群山之上`,`穿過高山草原，尋找雲海中的浮遊城`],approach:[`艾因格朗特`,`一百層的天際，懸浮於雲與光之間`],orbit:[`環城巡禮`,`完整環視浮遊城，從基座仰望最高王座`],arrival:[`向天空啟程`,`沿城外螺旋古道，一路攀向最頂端`]}[this.currentShot];return{shot:this.currentShot,label:e[0],subtitle:e[1],progress:this.elapsed/this.duration,shotProgress:this.currentShotProgress,time:this.elapsed,finished:this.finished,orbitRadians:this.orbitAngle,orbitDegrees:T.radToDeg(this.orbitAngle),position:this.camera.position.toArray(),target:this.target.toArray()}}update(e,t){this.elapsed=T.clamp(Number.isFinite(e)?e:0,0,this.duration),Number.isFinite(t)&&t>0&&(this.camera.aspect=t);let n=this.elapsed,r=this.camera;if(n<11){this.currentShot=`meadow`,this.currentShotProgress=n/11;let e=Q(this.currentShotProgress);r.position.set(T.lerp(Ge[0],Ke[0],e),0,T.lerp(Ge[1],Ke[1],e));let t=Q((n-3.5)/7.5);r.position.y=this.meadowHeight(r.position.x,r.position.z)+3.2+70.8*t,this.target.set(0,T.lerp(100,290,e),0),r.fov=T.lerp(55,48,e),this.orbitAngle=0}else if(n<17){this.currentShot=`approach`,this.currentShotProgress=(n-11)/6;let e=Q(this.currentShotProgress),t=T.lerp(Math.hypot(...Ke),qe,e);r.position.set(Math.sin(Z)*t,T.lerp(this.meadowHeight(...Ke)+74,360,e),Math.cos(Z)*t),this.target.set(0,T.lerp(290,315,e),0),r.fov=T.lerp(48,52,e),this.orbitAngle=0}else if(n<45){this.currentShot=`orbit`,this.currentShotProgress=(n-17)/28;let e=Q(this.currentShotProgress),t=Math.sin(Math.PI*e),i=qe-180*t;this.orbitAngle=We*e;let a=Z+this.orbitAngle;r.position.set(Math.sin(a)*i,360+80*e+110*t,Math.cos(a)*i),this.target.set(0,315+38*t,0),r.fov=52-3*t}else{this.currentShot=`arrival`,this.currentShotProgress=(n-45)/11;let e=Q(this.currentShotProgress),t=Math.atan2(this.entryCamera.x,this.entryCamera.z),i=Z+Math.atan2(Math.sin(t-Z),Math.cos(t-Z))*e,a=T.lerp(qe,Math.hypot(this.entryCamera.x,this.entryCamera.z),e);r.position.set(Math.sin(i)*a,T.lerp(440,this.entryCamera.y,e),Math.cos(i)*a),this.target.set(0,315,0).lerp(this.entryTarget,Q(T.smoothstep(e,.15,1))),r.fov=T.lerp(52,58,e),this.orbitAngle=We}return r.updateProjectionMatrix(),r.lookAt(this.target),r.updateMatrixWorld(),this.frame}},Ye={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`},Xe=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},Ze=new D(-1,1,1,-1,0,1),Qe=new class extends O{constructor(){super(),this.setAttribute(`position`,new h([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new h([0,2,0,0,2,0],2))}},$e=class{constructor(e){this._mesh=new p(Qe,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Ze)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},et=class extends Xe{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof B?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=U.clone(e.uniforms),this.material=new B({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new $e(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},tt=class extends Xe{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},nt=class extends Xe{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},rt=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new k);this._width=n.width,this._height=n.height,t=new a(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:d}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new et(Ye),this.copyPass.material.blending=0,this.timer=new se}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}tt!==void 0&&(r instanceof tt?n=!0:r instanceof nt&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new k);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},it=class extends Xe{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new V}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},at={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new V(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`},ot=class e extends Xe{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e===void 0?new k(256,256):new k(e.x,e.y),this.clearColor=new V(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);this.renderTargetBright=new a(i,o,{type:d}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new a(i,o,{type:d});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new a(i,o,{type:d});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),i=Math.round(i/2),o=Math.round(o/2)}let s=at;this.highPassUniforms=U.clone(s.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new B({uniforms:this.highPassUniforms,vertexShader:s.vertexShader,fragmentShader:s.fragmentShader}),this.separableBlurMaterials=[];let c=[6,10,14,18,22];i=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(c[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new k(1/i,1/o),i=Math.round(i/2),o=Math.round(o/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let l=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=l,this.bloomTintColors=[new H(1,1,1),new H(1,1,1),new H(1,1,1),new H(1,1,1),new H(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=U.clone(Ye.uniforms),this.blendMaterial=new B({uniforms:this.copyUniforms,vertexShader:Ye.vertexShader,fragmentShader:Ye.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new V,this._oldClearAlpha=1,this._basic=new pe,this._fsQuad=new $e(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new k(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(t,n,r,i,a){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this._fsQuad.render(t),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(r),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);return new B({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new k(.5,.5)},direction:{value:new k(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {

					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;

					for ( int i = 1; i < KERNEL_RADIUS; i ++ ) {

						float x = float( i );
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * w;

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new B({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};ot.BlurDirectionX=new k(1,0),ot.BlurDirectionY=new k(0,1);var st={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`},ct=class extends Xe{constructor(){super(),this.isOutputPass=!0,this.uniforms=U.clone(st.uniforms),this.material=new P({name:st.name,uniforms:this.uniforms,vertexShader:st.vertexShader,fragmentShader:st.fragmentShader}),this._fsQuad=new $e(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},S.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},lt={name:`FXAAShader`,uniforms:{tDiffuse:{value:null},resolution:{value:new k(1/1024,1/512)}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec2 resolution;
		varying vec2 vUv;

		#define EDGE_STEP_COUNT 6
		#define EDGE_GUESS 8.0
		#define EDGE_STEPS 1.0, 1.5, 2.0, 2.0, 2.0, 4.0
		const float edgeSteps[EDGE_STEP_COUNT] = float[EDGE_STEP_COUNT]( EDGE_STEPS );

		float _ContrastThreshold = 0.0312;
		float _RelativeThreshold = 0.063;
		float _SubpixelBlending = 1.0;

		vec4 Sample( sampler2D  tex2D, vec2 uv ) {

			return texture( tex2D, uv );

		}

		float SampleLuminance( sampler2D tex2D, vec2 uv ) {

			return dot( Sample( tex2D, uv ).rgb, vec3( 0.3, 0.59, 0.11 ) );

		}

		float SampleLuminance( sampler2D tex2D, vec2 texSize, vec2 uv, float uOffset, float vOffset ) {

			uv += texSize * vec2(uOffset, vOffset);
			return SampleLuminance(tex2D, uv);

		}

		struct LuminanceData {

			float m, n, e, s, w;
			float ne, nw, se, sw;
			float highest, lowest, contrast;

		};

		LuminanceData SampleLuminanceNeighborhood( sampler2D tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData l;
			l.m = SampleLuminance( tex2D, uv );
			l.n = SampleLuminance( tex2D, texSize, uv,  0.0,  1.0 );
			l.e = SampleLuminance( tex2D, texSize, uv,  1.0,  0.0 );
			l.s = SampleLuminance( tex2D, texSize, uv,  0.0, -1.0 );
			l.w = SampleLuminance( tex2D, texSize, uv, -1.0,  0.0 );

			l.ne = SampleLuminance( tex2D, texSize, uv,  1.0,  1.0 );
			l.nw = SampleLuminance( tex2D, texSize, uv, -1.0,  1.0 );
			l.se = SampleLuminance( tex2D, texSize, uv,  1.0, -1.0 );
			l.sw = SampleLuminance( tex2D, texSize, uv, -1.0, -1.0 );

			l.highest = max( max( max( max( l.n, l.e ), l.s ), l.w ), l.m );
			l.lowest = min( min( min( min( l.n, l.e ), l.s ), l.w ), l.m );
			l.contrast = l.highest - l.lowest;
			return l;

		}

		bool ShouldSkipPixel( LuminanceData l ) {

			float threshold = max( _ContrastThreshold, _RelativeThreshold * l.highest );
			return l.contrast < threshold;

		}

		float DeterminePixelBlendFactor( LuminanceData l ) {

			float f = 2.0 * ( l.n + l.e + l.s + l.w );
			f += l.ne + l.nw + l.se + l.sw;
			f *= 1.0 / 12.0;
			f = abs( f - l.m );
			f = clamp( f / l.contrast, 0.0, 1.0 );

			float blendFactor = smoothstep( 0.0, 1.0, f );
			return blendFactor * blendFactor * _SubpixelBlending;

		}

		struct EdgeData {

			bool isHorizontal;
			float pixelStep;
			float oppositeLuminance, gradient;

		};

		EdgeData DetermineEdge( vec2 texSize, LuminanceData l ) {

			EdgeData e;
			float horizontal =
				abs( l.n + l.s - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.se - 2.0 * l.e ) +
				abs( l.nw + l.sw - 2.0 * l.w );
			float vertical =
				abs( l.e + l.w - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.nw - 2.0 * l.n ) +
				abs( l.se + l.sw - 2.0 * l.s );
			e.isHorizontal = horizontal >= vertical;

			float pLuminance = e.isHorizontal ? l.n : l.e;
			float nLuminance = e.isHorizontal ? l.s : l.w;
			float pGradient = abs( pLuminance - l.m );
			float nGradient = abs( nLuminance - l.m );

			e.pixelStep = e.isHorizontal ? texSize.y : texSize.x;

			if (pGradient < nGradient) {

				e.pixelStep = -e.pixelStep;
				e.oppositeLuminance = nLuminance;
				e.gradient = nGradient;

			} else {

				e.oppositeLuminance = pLuminance;
				e.gradient = pGradient;

			}

			return e;

		}

		float DetermineEdgeBlendFactor( sampler2D  tex2D, vec2 texSize, LuminanceData l, EdgeData e, vec2 uv ) {

			vec2 uvEdge = uv;
			vec2 edgeStep;
			if (e.isHorizontal) {

				uvEdge.y += e.pixelStep * 0.5;
				edgeStep = vec2( texSize.x, 0.0 );

			} else {

				uvEdge.x += e.pixelStep * 0.5;
				edgeStep = vec2( 0.0, texSize.y );

			}

			float edgeLuminance = ( l.m + e.oppositeLuminance ) * 0.5;
			float gradientThreshold = e.gradient * 0.25;

			vec2 puv = uvEdge + edgeStep * edgeSteps[0];
			float pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
			bool pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !pAtEnd; i++ ) {

				puv += edgeStep * edgeSteps[i];
				pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
				pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			}

			if ( !pAtEnd ) {

				puv += edgeStep * EDGE_GUESS;

			}

			vec2 nuv = uvEdge - edgeStep * edgeSteps[0];
			float nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
			bool nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !nAtEnd; i++ ) {

				nuv -= edgeStep * edgeSteps[i];
				nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
				nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			}

			if ( !nAtEnd ) {

				nuv -= edgeStep * EDGE_GUESS;

			}

			float pDistance, nDistance;
			if ( e.isHorizontal ) {

				pDistance = puv.x - uv.x;
				nDistance = uv.x - nuv.x;

			} else {

				pDistance = puv.y - uv.y;
				nDistance = uv.y - nuv.y;

			}

			float shortestDistance;
			bool deltaSign;
			if ( pDistance <= nDistance ) {

				shortestDistance = pDistance;
				deltaSign = pLuminanceDelta >= 0.0;

			} else {

				shortestDistance = nDistance;
				deltaSign = nLuminanceDelta >= 0.0;

			}

			if ( deltaSign == ( l.m - edgeLuminance >= 0.0 ) ) {

				return 0.0;

			}

			return 0.5 - shortestDistance / ( pDistance + nDistance );

		}

		vec4 ApplyFXAA( sampler2D  tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData luminance = SampleLuminanceNeighborhood( tex2D, texSize, uv );
			if ( ShouldSkipPixel( luminance ) ) {

				return Sample( tex2D, uv );

			}

			float pixelBlend = DeterminePixelBlendFactor( luminance );
			EdgeData edge = DetermineEdge( texSize, luminance );
			float edgeBlend = DetermineEdgeBlendFactor( tex2D, texSize, luminance, edge, uv );
			float finalBlend = max( pixelBlend, edgeBlend );

			if (edge.isHorizontal) {

				uv.y += edge.pixelStep * finalBlend;

			} else {

				uv.x += edge.pixelStep * finalBlend;

			}

			return Sample( tex2D, uv );

		}

		void main() {

			gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );

		}`},ut=class extends et{constructor(){super(lt)}setSize(e,t){this.material.uniforms.resolution.value.set(1/e,1/t)}},dt=class{renderer;composer;renderPass;bloom;output=new ct;fxaa=new ut;copyMaterial=new B({name:`Aincrad screen composite`,uniforms:{tDiffuse:{value:null}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,fragmentShader:`uniform sampler2D tDiffuse; varying vec2 vUv; void main(){gl_FragColor=texture2D(tDiffuse,vUv);}`,depthTest:!1,depthWrite:!1,blending:0,toneMapped:!1});copy=new $e(this.copyMaterial);viewport=new x;scissor=new x;width=0;height=0;disposed=!1;constructor(e,t,n){this.renderer=e;let r=new a(8,8,{type:d,depthBuffer:!0,stencilBuffer:!1});r.texture.name=`Aincrad HDR`,this.composer=new rt(e,r),this.composer.setPixelRatio(1),this.composer.renderToScreen=!1,this.renderPass=new it(t,n),this.bloom=new ot(new k(8,8),.16,.42,1.15),this.composer.addPass(this.renderPass),this.composer.addPass(this.bloom),this.composer.addPass(this.output),this.composer.addPass(this.fxaa)}render(e,t,n,r,i=0,a=`high`){if(this.disposed)return;let o=this.renderer,s=Math.min(o.getPixelRatio(),a===`high`?1.5:1),c=Math.max(8,Math.ceil(n*s/8)*8),l=Math.max(8,Math.ceil(r*s/8)*8);(c!==this.width||l!==this.height)&&(this.width=c,this.height=l,this.composer.setSize(c,l)),this.renderPass.scene=e,this.renderPass.camera=t,this.bloom.enabled=a===`high`,o.getViewport(this.viewport),o.getScissor(this.scissor);let u=o.getRenderTarget(),d=o.getScissorTest(),f=o.autoClear,p=o.toneMapping,m=o.toneMappingExposure;try{o.setScissorTest(!1),o.autoClear=!0,o.toneMapping=6,o.toneMappingExposure=1.03,this.composer.render(i),o.setRenderTarget(u),o.setViewport(this.viewport),o.setScissor(this.scissor),o.setScissorTest(d),o.autoClear=!1,this.copyMaterial.uniforms.tDiffuse.value=this.composer.readBuffer.texture,this.copy.render(o)}finally{o.setRenderTarget(u),o.setViewport(this.viewport),o.setScissor(this.scissor),o.setScissorTest(d),o.autoClear=f,o.toneMapping=p,o.toneMappingExposure=m}}dispose(){this.disposed||(this.disposed=!0,this.bloom.dispose(),this.output.dispose(),this.fxaa.dispose(),this.composer.dispose(),this.copyMaterial.dispose(),this.copy.dispose())}},ft=[{name:`銀葉巡林者`,color:5005910,accent:12427632,hair:13154711,skin:13147779},{name:`緋暮旅人`,color:6768201,accent:11049343,hair:3549217,skin:12159345},{name:`霧峰斥候`,color:5399403,accent:10987674,hair:10194039,skin:14070425},{name:`苔谷守望者`,color:6841672,accent:11638630,hair:4076582,skin:10252631},{name:`月河尋路人`,color:5198699,accent:10726574,hair:11842730,skin:13080703},{name:`琥珀遊俠`,color:7954758,accent:12756852,hair:7159856,skin:11830372}];function pt(e,t=24){let n=[],r=[],i=[];e.forEach(([a,o,s,c=0],l)=>{for(let u=0;u<=t;u++){let d=u/t*Math.PI*2;if(n.push(Math.sin(d)*o,a,Math.cos(d)*s+c),r.push(u/t,l/(e.length-1)),l&&u){let e=l*(t+1)+u;i.push(e,e-1,e-t-2,e,e-t-2,e-t-1)}}});let a=new O;return a.setAttribute(`position`,new h(n,3)),a.setAttribute(`uv`,new h(r,2)),a.setIndex(i),a.computeVertexNormals(),a}function $(e,t,n=6,r=12){return new ve(new i(e.map(([e,t,n])=>new H(e,t,n))),r,t,n,!1)}function mt(e,t=!1){let n=t?[[.129,.914,-.042],[.335,1.008,-.031],[.193,.901,-.052],[.14,.885,-.05]]:[[.114,.936,.002],[.375,1.035,-.013],[.224,.886,-.003],[.138,.865,.006]],r=n.flatMap(([n,r,i])=>[n*e,r,i-(t?.002:.048)]);t||r.push(...n.flatMap(([t,n,r])=>[t*e,n,r+.018]));let i=new O,a=t?[0,1,2,0,2,3]:[0,1,2,0,2,3,6,5,4,7,6,4,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0];if(i.setAttribute(`position`,new h(r,3)),i.setAttribute(`uv`,new h(Array(r.length/3).fill([0,0]).flat(),2)),e<0)for(let e=0;e<a.length;e+=3)[a[e],a[e+2]]=[a[e+2],a[e]];return i.setIndex(a),i.computeVertexNormals(),i}function ht(){let e=new Uint8Array(16384);for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=(t*64+n)*4,i=(n*29+t*31+n*t*3)%13-6,a=205+(n%4<2?19:0)+(t%4<2?15:0)+i;e[r]=e[r+1]=e[r+2]=a,e[r+3]=255}let t=new g(e,64,64,z);return t.wrapS=t.wrapT=re,t.repeat.set(5,5),t.magFilter=t.minFilter=u,t.needsUpdate=!0,t}function gt(e){e.updateMatrixWorld(!0);let t=e.matrixWorld.clone().invert(),n=new Map,r=new Set;e.traverse(e=>{if(!(e instanceof p)||Array.isArray(e.material))return;let i=e.geometry.index?e.geometry.toNonIndexed():e.geometry.clone();i.applyMatrix4(t.clone().multiply(e.matrixWorld));let a=n.get(e.material)??[];a.push(i),n.set(e.material,a),r.add(e.geometry)}),e.clear();for(let[t,r]of n){let n=M(r);n&&A(e,n,t),r.forEach(e=>e.dispose())}r.forEach(e=>e.dispose())}var _t=class{id;root=new c;rig=new c;limbs=[];eyes=new c;marker;materials=[];opacity=1;skin;head=new c;elbows=[];knees=[];cloak;cloakBase;cloakFrame=0;targetRotation=new R;targetEuler=new F(0,0,0,`YXZ`);constructor(e,t,n=e%10){this.id=e;let r=ft[(n%ft.length+ft.length)%ft.length];this.skin={name:r.name,color:r.color,accent:r.accent,type:`elf`},this.root.name=`castle-exclusive-elf`,this.root.userData.costume=r.name,this.root.userData.appearance=`elf`,this.root.add(this.rig);let i=ht(),a=(e,t=.8,n=0)=>new E({color:e,roughness:t,metalness:n}),s=new f({color:r.skin,roughness:.62,metalness:0,sheen:.16,sheenColor:14990245,sheenRoughness:.85}),l=a(new V(r.skin).multiplyScalar(.8).getHex(),.74);l.side=2;let u=a(r.color,.93);u.map=i,u.bumpMap=i,u.bumpScale=.009;let d=a(4601643,.73);d.bumpMap=i,d.bumpScale=.004;let m=a(2959652,.83),g=a(r.accent,.41,.72),_=a(9601642,.9),v=a(r.hair,.72),y=a(new V(r.hair).lerp(new V(13219488),.23).getHex(),.69),x=a(4215626,.4),S=a(1120021,.3),C=a(12762026,.44),w=a(new V(r.skin).lerp(new V(7225401),.5).getHex(),.85),T=(e,t=20,n=12)=>new fe(e,t,n),D=new c;this.rig.add(D),A(D,pt([[-.11,.14,.088],[-.025,.157,.105],[.15,.123,.093],[.37,.18,.116],[.49,.209,.105],[.55,.173,.08],[.6,.061,.058]]),u),A(D,pt([[.115,.133,.106],[.23,.14,.113],[.405,.19,.126],[.5,.195,.11]]),d),A(D,new o(.05,.059,.145,16),s,[0,.635,0]),A(D,pt([[.565,.075,.066],[.64,.063,.058]]),u);let te=A(D,new ne(.069,.008,5,24),_,[0,.639,0]);te.rotation.x=Math.PI/2,te.scale.y=.86;for(let e=0;e<5;e++){let t=.27+e*.045;A(D,$([[-.022,t,-.126],[.024,t+.032,-.13]],.0032,4,1),_),A(D,$([[.022,t,-.126],[-.024,t+.032,-.13]],.0032,4,1),_)}let re=A(D,L(.048,.59,.025,.009),m,[-.01,.315,-.138]);re.rotation.z=-.47;let O=A(D,L(.067,.075,.031,.004),g,[-.042,.4,-.156]);O.rotation.z=-.47,A(D,L(.027,.04,.015,.003),m,[-.042,.4,-.178]).rotation.z=-.47,A(D,pt([[.065,.162,.116],[.135,.146,.116]]),m),A(D,L(.086,.066,.02,.006),g,[0,.1,-.125]),A(D,L(.057,.039,.025,.002),d,[0,.1,-.138]),A(D,new _e(.007,.047,.008),g,[0,.1,-.154]);for(let e of[-1,1]){let t=A(D,L(.132,.28,.046,.015),u,[e*.081,-.083,-.086]);t.rotation.z=e*.11;let n=A(D,L(.007,.235,.012,.002),_,[e*.138,-.083,-.112]);n.rotation.z=e*.11,A(D,L(.13,.12,.08,.015),d,[e*.18,.07,0]),A(D,L(.115,.038,.084,.01),m,[e*.18,.105,-.003]),A(D,T(.011,8,6),g,[e*.18,.079,-.045]),A(D,T(.104),d,[e*.21,.495,.006],[1.08,.72,1.22]),A(D,T(.098),g,[e*.218,.515,.003],[1.08,.38,1.21]);for(let t of[-.082,.074])A(D,T(.008,8,6),g,[e*.236,.502,t]);A(D,T(.025,12,8),g,[e*.13,.515,-.105],[1,1,.35])}gt(D),this.rig.add(this.head);let k=new c;this.head.add(k,this.eyes),A(k,pt([[.698,.021,.032,-.019],[.724,.061,.071,-.006],[.765,.09,.096,.003],[.821,.117,.114,.003],[.887,.125,.121,.002],[.96,.119,.123,.006],[1.019,.09,.105,.016],[1.046,.014,.026,.018]],32),s);for(let e of[-1,1]){A(k,mt(e),s),A(k,mt(e,!0),l),A(k,T(.041,16,10),s,[e*.081,.834,-.085],[1,.52,.53]);let t=A(k,T(.039,16,10),s,[e*.054,.927,-.103],[1.2,.35,.35]);t.rotation.z=e*-.13,A(k,$([[e*.023,.934,-.117],[e*.052,.941,-.119],[e*.087,.931,-.107]],.0043,5,6),v),A(k,$([[e*.019,.907,-.12],[e*.052,.919,-.127],[e*.089,.906,-.107]],.0027,4,6),w),A(this.eyes,T(.036,16,10),C,[e*.053,.905,-.111],[1,.32,.4]),A(this.eyes,T(.011,12,8),x,[e*.049,.905,-.125],[.94,1,.31]),A(this.eyes,T(.005,10,6),S,[e*.049,.905,-.129],[.85,1,.38]),A(this.eyes,T(.0019,8,6),C,[e*.049-.002,.909,-.132])}A(k,T(.032,16,12),s,[0,.873,-.12],[.48,1.7,.72]),A(k,T(.021,16,10),s,[0,.838,-.145],[.7,.66,.89]);for(let e of[-1,1])A(k,T(.012,12,8),s,[e*.015,.832,-.134],[.8,.6,.8]);A(k,$([[-.033,.788,-.092],[-.012,.791,-.107],[0,.787,-.109],[.012,.791,-.107],[.033,.788,-.092]],.003,5,10),w),A(k,T(.027,16,8),s,[0,.768,-.08],[1.05,.33,.35]),A(k,new fe(1,28,16,0,Math.PI*2,0,Math.PI*.6),v,[0,.966,.021],[.136,.112,.137]),A(k,T(.125,20,12),v,[0,.938,.07],[.95,1.07,.67]);for(let e=0;e<14;e++){let t=e/13*Math.PI*1.45-Math.PI*.225,n=Math.sin(t),r=Math.cos(t);A(k,$([[n*.035,1.071,.032+r*.022],[n*.109,1.035,.023+r*.094],[n*.136,.959,.023+r*.128]],.0034,4,8),y)}for(let e=0;e<7;e++){let t=e*.011;A(k,$([[.086-t,1.054,-.035],[.022-t,1.065,-.106],[-.065-t*.72,1.015-t*.22,-.131],[-.11-t*.1,.953-t*.55,-.089]],.009-e*5e-4,6,12),e%3?v:y)}for(let e of[-1,1]){A(k,$([[e*.118,.991,.011],[e*.141,.92,.024],[e*.145,.808,.043],[e*.105,.708,.066]],.021,7,12),v);for(let t=0;t<8;t++)A(k,T(.018,12,8),t%2?v:y,[e*(.13+Math.sin(t*2.3)*.012),.84-t*.024,.053],[.7,1,.8]);let t=A(k,new ne(.013,.004,5,10),g,[e*.131,.666,.053]);t.rotation.x=Math.PI/2}gt(k),gt(this.eyes),this.eyes.children.forEach(e=>e.position.y-=.905),this.eyes.position.y=.905;for(let e of[-1,1]){let t=new c;t.position.set(e*.232,.482,0);let n=new c;A(n,new b(.065,.165,6,14),u,[0,-.108,0],[1,1,.94]),A(n,new o(.068,.064,.044,14),d,[0,-.155,0]),gt(n);let r=new c;r.position.y=-.245,A(r,new b(.051,.15,6,14),u,[0,-.095,0]),A(r,pt([[-.205,.044,.045],[-.17,.061,.052],[-.055,.054,.051]]),d),A(r,L(.056,.126,.024,.01),g,[0,-.12,-.049]);for(let e of[-.065,-.176])A(r,new o(.057,.056,.018,14),m,[0,e,0]);A(r,T(.043,14,10),s,[0,-.239,-.004],[.82,1.34,.59]),A(r,T(.016,10,8),s,[-e*.036,-.226,-.009],[.8,1.65,.85]),A(r,L(.059,.065,.024,.009),m,[0,-.223,.014]),gt(r),t.add(n,r),this.rig.add(t),this.limbs.push(t),this.elbows.push(r)}for(let e of[-1,1]){let t=new c;t.position.set(e*.086,-.02,0);let n=new c;A(n,new b(.074,.158,6,16),u,[0,-.134,0],[.94,1,1]),A(n,new o(.07,.063,.039,14),m,[0,-.177,0]),gt(n);let r=new c;r.position.y=-.29,A(r,new b(.051,.17,6,14),u,[0,-.137,0]),A(r,T(.059,14,10),d,[0,-.014,-.033],[.87,.86,.6]),A(r,pt([[-.353,.064,.066],[-.25,.059,.06],[-.16,.065,.067],[-.125,.061,.063]]),d),A(r,new o(.068,.067,.025,14),m,[0,-.137,0]),A(r,T(.071,18,10),d,[0,-.365,-.042],[.93,.66,1.61]),A(r,L(.143,.035,.235,.014),m,[0,-.419,-.047]),A(r,L(.116,.028,.06,.005),g,[0,-.269,-.062]);for(let e=0;e<4;e++)A(r,$([[-.025,-.168-e*.035,-.064],[.025,-.191-e*.035,-.066]],.003,4,1),_);gt(r),t.add(n,r),this.rig.add(t),this.limbs.push(t),this.knees.push(r)}let j=new ie(1,1,14,22),ae=j.getAttribute(`position`),oe=j.getAttribute(`uv`),se=[];for(let e=0;e<ae.count;e++){let t=oe.getX(e),n=1-oe.getY(e);ae.setXYZ(e,(t-.5)*(.365+n*.335),.555-n*1.02,.13+n*.16+Math.cos(t*Math.PI*10)*.015*n);let i=t<.075||t>.925||n>.956,a=new V(i?r.accent:16777215);i&&a.lerp(new V(16777215),.35),se.push(a.r,a.g,a.b)}j.setAttribute(`color`,new h(se,3)),j.computeVertexNormals(),this.cloakBase=new Float32Array(ae.array);let M=u.clone();M.color.multiplyScalar(.66),M.side=2,M.vertexColors=!0,this.cloak=A(this.rig,j,M),this.cloak.name=`animated-woven-cloak`,t!==null&&(this.marker=A(this.root,new ee(.071,0),new E({color:t===0?13810813:9550528,emissive:t===0?8413233:3433582,emissiveIntensity:.4,roughness:.36,metalness:.6}),[0,1.42,0]),this.marker.castShadow=!1);let N=new Set;this.root.traverse(e=>{if(e instanceof p)for(let t of Array.isArray(e.material)?e.material:[e.material])N.add(t)}),this.materials=[...N]}setOpacity(e){if(e=T.clamp(e,0,1),this.opacity!==e){this.opacity=e;for(let t of this.materials){let n=e<1;t.alphaHash!==n&&(t.alphaHash=n,t.needsUpdate=!0),t.opacity=e}}}animate(e,t,n,r,i){let a=e===`run`,o=e===`airborne`,s=e===`finished`,c=t*Math.max(n,1)*2.55,l=Math.sin(c),u=Math.min(1,n/4.5);if(this.rig.position.y=a?Math.abs(l)*.021*u:Math.sin(t*1.9+this.id)*.004,e!==`stumble`){this.targetEuler.set(e===`dive`?-Math.PI/2:a?-.067:0,r,a?l*.016:0,`YXZ`),this.targetRotation.setFromEuler(this.targetEuler),this.rig.quaternion.slerp(this.targetRotation,1-Math.exp(-Math.max(i,.001)*13));for(let n=0;n<2;n++){let r=n===0?-1:1,i=l*r;this.limbs[n].rotation.set(a?i*.67*u:s?2.48+Math.sin(t*4+n)*.12:o?.55:e===`dive`?2.75:.07,0,r*(o?.3:.105)),this.elbows[n].rotation.x=a?.42+Math.max(0,-i)*.3:s?.18:.16,this.limbs[n+2].rotation.x=a?-i*.66*u:o?n?.28:-.38:e===`dive`?-.12:0,this.knees[n].rotation.x=a?-Math.max(0,i)*.97*u:o?-.65:-.025}}this.head.rotation.y=Math.sin(t*.62+this.id)*(a?.015:.035),this.eyes.scale.y=Math.sin(t*1.15+this.id*.7)>.995?.08:1;let d=this.cloak.geometry.getAttribute(`position`),f=this.cloak.geometry.getAttribute(`uv`);for(let e=0;e<d.count;e++){let n=1-f.getY(e),r=f.getX(e),i=n*n;d.setXYZ(e,this.cloakBase[e*3]+Math.sin(t*2.6+n*3+this.id)*i*.022,this.cloakBase[e*3+1]+(a?.12*u:.01)*i,this.cloakBase[e*3+2]+i*((a?.14*u:.02)+Math.sin(t*(a?7:2.5)-n*5+r*4+this.id)*(a?.045:.018)))}d.needsUpdate=!0,++this.cloakFrame%3==0&&this.cloak.geometry.computeVertexNormals(),this.marker&&(this.marker.position.y=1.42+Math.sin(t*2)*.035,this.marker.rotation.y=t*.45)}},vt=class extends he{decide(t,n){let r=t>=this.nextReaction,i=super.decide(t,n),a=this.actor;if(r&&(this.nextReaction=t+.04+(1-a.skill)*.045),!a.active||!a.grounded||a.machine.state===`respawn`)return i;let o=Math.hypot(i.x,i.z);if(o<.01)return i;let s=i.x/o,c=i.z/o,l=e=>!(e.collisionGroups()>>>16&1),u=!1;for(let t of[1.15,2.15]){let n=a.world.castRay(new e.Ray({x:a.current.x+s*t,y:a.current.y,z:a.current.z+c*t},{x:0,y:-1,z:0}),2.25,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,l);(!n||n.timeOfImpact<.4)&&(u=!0)}return{...i,jump:u||this.stuckTime>.8}}};export{vt as AincradBrain,Je as AincradCinematic,dt as AincradPostProcessing,_t as ElfAppearance,Fe as aincradMeadowHeight,Ue as createAincradCourse,Be as createAincradWorld};