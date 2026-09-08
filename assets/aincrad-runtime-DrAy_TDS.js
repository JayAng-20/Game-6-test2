import{a as e,r as t}from"./world-CeqXiYg9.js";import{$ as n,A as r,At as i,B as a,C as o,Ct as s,D as c,Dt as l,E as u,Et as d,G as f,H as p,I as m,J as h,K as g,L as _,M as v,Mt as y,N as b,O as x,Ot as S,P as C,Q as w,R as T,S as E,St as D,T as O,Tt as k,U as A,V as j,W as M,X as N,Y as P,Z as F,_ as ee,_t as te,a as ne,at as I,b as L,bt as R,ct as z,dt as B,et as re,f as V,ft as H,g as ie,h as U,ht as W,i as ae,it as oe,j as G,jt as K,k as se,kt as q,lt as ce,mt as le,nt as J,ot as ue,pt as de,q as fe,rt as Y,st as pe,t as me,tt as he,ut as X,v as ge,vt as Z,w as _e,wt as ve,x as ye,xt as be,y as xe,yt as Se}from"./ai-y692AFdf.js";import{a as Ce,i as we,r as Q,t as Te}from"./aincrad-OBeMX9JB.js";var Ee=class e extends w{constructor(){let t=e.SkyShader,n=new Z({name:t.name,uniforms:d.clone(t.uniforms),vertexShader:t.vertexShader,fragmentShader:t.fragmentShader,side:1,depthWrite:!1});super(new L(1,1,1),n),this.isSky=!0}};Ee.SkyShader={name:`SkyShader`,uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new i},up:{value:new i(0,1,0)},cloudScale:{value:2e-4},cloudSpeed:{value:1e-4},cloudCoverage:{value:.4},cloudDensity:{value:.4},cloudElevation:{value:.5},showSunDisc:{value:1},time:{value:0}},vertexShader:`
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

		}`};function $(e,t){let n=Math.sin(e*127.1+t*311.7)*43758.5453123;return n-Math.floor(n)}function De(e,t){let n=Math.floor(e),r=Math.floor(t),i=e-n,a=t-r;return i=i*i*(3-2*i),a=a*a*(3-2*a),N.lerp(N.lerp($(n,r),$(n+1,r),i),N.lerp($(n,r+1),$(n+1,r+1),i),a)}function Oe(e,t){let n=0,r=.5;for(let i=0;i<5;i++)n+=De(e,t)*r,e=e*2.03+17.1,t=t*2.03+9.2,r*=.5;return n}function ke(e,t,n=!1){let r=new G(e,t,t,B);return r.wrapS=r.wrapT=de,r.magFilter=h,r.minFilter=P,r.generateMipmaps=!0,r.anisotropy=8,n&&(r.colorSpace=W),r.needsUpdate=!0,r}function Ae(e){let t=e===`stone`?1024:512,n=new Uint8Array(t*t*4),r=new Uint8Array(t*t*4),a=new Uint8Array(t*t*4),o=new Float32Array(t*t);for(let r=0;r<t;r++)for(let i=0;i<t;i++){let s=r*t+i,c=s*4,l=$(i,r),u=(Math.sin(Math.PI*i/t)*Math.sin(Math.PI*r/t))**.5,d=i*256/t,f=r*256/t,p=.5+(Oe(d/23,f/23)-.5)*u,m=.5+(Oe(d/84,f/84)-.5)*u,h=p*.7+l*.08,g=160,_=160,v=148;if(e===`stone`){let e=Math.floor(f/32),t=(d+e%2*32)%64,n=f%32,r=t<.65+l*.3||t>63.35||n<.65+l*.3||n>31.35,i=$(Math.floor((d+e%2*32)/64),e),a=Math.abs(Math.sin(d*.12+f*.09+p*15))<.024,o=(r?.51:.65+i*.23)*(.79+p*.25+m*.14)+(l-.5)*.08-(a?.08:0);g=o*205,_=o*202,v=o*185,h=(r?.29:.65+i*.12)+p*.2+l*.09}else if(e===`rock`){let e=Oe(d/12,f/12)*u,t=.49+p*.32+e*.08;g=t*131,_=t*143,v=t*142,h=p*.6+e*.27+l*.1}else{let e=.6+p*.5+l*.11;g=e*108,_=e*124,v=e*58,h=p*.65+l*.35}n[c]=g,n[c+1]=_,n[c+2]=v,n[c+3]=255,o[s]=h;let y=e===`stone`?175+m*67:215+m*36;a[c]=a[c+1]=a[c+2]=y,a[c+3]=255}let s=new i;for(let e=0;e<t;e++)for(let n=0;n<t;n++){let i=(r,i)=>o[(e+i+t)%t*t+(n+r+t)%t];s.set((i(-1,0)-i(1,0))*1.7,(i(0,-1)-i(0,1))*1.7,1).normalize();let a=(e*t+n)*4;r[a]=(s.x*.5+.5)*255,r[a+1]=(s.y*.5+.5)*255,r[a+2]=(s.z*.5+.5)*255,r[a+3]=255}return{map:ke(n,t,!0),normalMap:ke(r,t),roughnessMap:ke(a,t)}}function je(){let e=Ae(`stone`),t=Ae(`rock`),n=Ae(`grass`),r=new Uint8Array(262144);for(let e=0;e<256;e++)for(let t=0;t<256;t++){let n=(e*256+t)*4,i=t/256,a=e/256,o=Math.abs(Math.sin((i+a*.5)*Math.PI*12))<.075||Math.abs(Math.sin((i-a*.5)*Math.PI*12))<.075,s=new c([2116965,6454396,12096594,5464657,4282745][Math.floor($(Math.floor(i*12+a*6),Math.floor(i*12-a*6))*5)]),l=o?.08:.8+$(t,e)*.2;r[n]=Math.sqrt(s.r)*255*l,r[n+1]=Math.sqrt(s.g)*255*l,r[n+2]=Math.sqrt(s.b)*255*l,r[n+3]=255}let i=ke(r,256,!0),a=new J({...e,color:13223865,roughness:.9,normalScale:new q(.48,.48)}),o=new J({...e,color:13353388,roughness:.79,normalScale:new q(.78,.78)}),s=new J({...e,color:14802377,roughness:.86,normalScale:new q(.28,.28)}),l={stone:a,path:o,limestone:s,rock:new J({...t,color:9213585,roughness:1,normalScale:new q(1.05,1.05)}),grass:new J({...n,color:9083492,roughness:1,normalScale:new q(.3,.3)}),bronze:new J({color:5402473,roughness:.57,metalness:.64}),gold:new J({color:12360541,roughness:.46,metalness:.72}),window:new J({color:13950935,map:i,emissiveMap:i,roughness:.19,metalness:.28,emissive:16764800,emissiveIntensity:.35,side:2}),foliage:new J({color:4808509,roughness:1}),bark:new J({...t,color:7496269,roughness:1})};return a.name=s.name=`Aincrad masonry`,o.name=`Aincrad paving`,{...l,dispose(){for(let e of Object.values(l))e.dispose();for(let r of[e,t,n])for(let e of Object.values(r))e.dispose();i.dispose()}}}function Me(e=0){let t=new Uint8Array(65536),n=(t,n)=>Math.sin((t*4+n*2)*Math.PI*2/128+e)*.55+Math.sin((t*9-n*7)*Math.PI*2/128+e*1.3)*.22+Math.cos((t*17+n*13)*Math.PI*2/128)*.1,r=new i;for(let e=0;e<128;e++)for(let i=0;i<128;i++){r.set((n(i-1,e)-n(i+1,e))*.7,(n(i,e-1)-n(i,e+1))*.7,1).normalize();let a=(e*128+i)*4;t[a]=(r.x*.5+.5)*255,t[a+1]=(r.y*.5+.5)*255,t[a+2]=(r.z*.5+.5)*255,t[a+3]=255}return ke(t,128)}function Ne(){let e=document.createElement(`canvas`);e.width=e.height=256;let t=e.getContext(`2d`);t.lineCap=`round`;let n=(e,n,r,i,a,o)=>{t.beginPath(),t.moveTo(e,n),t.lineTo(r,i),t.strokeStyle=a,t.lineWidth=o,t.stroke()};n(128,250,128,18,`#65583b`,3);for(let e=0;e<20;e++)for(let t of[-1,1]){let r=236-e*10,i=128+t*((1-e/23)*105),a=r-33;n(128,r,i,a,`#465c34`,1.7);for(let o=0;o<24;o++){let s=o/24,c=128+(i-128)*s,l=r+(a-r)*s,u=$(e,o)>.5?`#577340`:`#8b9a61`;n(c,l,c+t*(6+$(o,e)*9),l-8-$(e,o)*12,u,1.4),n(c,l,c+t*9,l+6,u,1.1)}}let r=new o(e);r.colorSpace=W,r.anisotropy=8;let i=new J({map:r,roughness:1,side:2,alphaTest:.42,color:10728859}),a=[];for(let e=0;e<13;e++)for(let t=0;t<5;t++){let n=.5*(1-e/15),r=.26,i=t/5*Math.PI*2+e*.77,o=new z(n,r,1,2);o.rotateX(-.5),o.translate(0,r/2,n*.22),o.rotateY(i),o.translate(0,.09+e*.059,0),a.push(o)}let s=ie(a);return a.forEach(e=>e.dispose()),{geometry:s,material:i,map:r}}var Pe=Math.PI*2,Fe=e=>484-(e-80)*.55;function Ie(e=!1){let t=(e,t,n,r)=>{e.moveTo(-t,n),e.lineTo(t,n),e.lineTo(t,r*.58),e.quadraticCurveTo(t*.95,r*.82,0,r),e.quadraticCurveTo(-t*.95,r*.82,-t,r*.58),e.closePath()},n=new Se;return e?(n.moveTo(-.5,0),n.lineTo(-.5,.58),n.quadraticCurveTo(-.475,.82,0,1),n.quadraticCurveTo(.475,.82,.5,.58),n.lineTo(.5,0),n.lineTo(.365,0),n.lineTo(.365,.51),n.quadraticCurveTo(.347,.72,0,.88),n.quadraticCurveTo(-.347,.72,-.365,.51),n.lineTo(-.365,0),n.closePath()):t(n,.5,0,1),new _(n,{depth:e?.18:.035,bevelEnabled:e,bevelSize:.018,bevelThickness:.018,bevelSegments:1,steps:1,curveSegments:5})}var Le=class{root;batches=new Map;constructor(e){this.root=e}add(e,t,n,r,i,a=new X,o=new c(1,1,1)){let s=this.batches.get(e);s||(s={geometry:t,material:n,matrices:[],colors:[]},this.batches.set(e,s)),s.matrices.push(new F().compose(r,a,i)),s.colors.push(o)}finish(){for(let[e,t]of this.batches){let n=t.geometry,r=t.material;if(r instanceof J&&/masonry|paving/.test(r.name)){r=r.clone(),n=n.clone();let e=new Float32Array(t.matrices.length*3);t.matrices.forEach((t,n)=>{let r=t.elements;e[n*3]=Math.hypot(r[0],r[1],r[2]),e[n*3+1]=Math.hypot(r[4],r[5],r[6]),e[n*3+2]=Math.hypot(r[8],r[9],r[10])}),n.setAttribute(`masonrySize`,new f(e,3));let i=/Cylinder|Cone/.test(n.type);r.onBeforeCompile=e=>{e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
attribute vec3 masonrySize;`),e.vertexShader=e.vertexShader.replace(`#include <uv_vertex>`,`#include <uv_vertex>
            vec2 masonryRepeat=${i?`vec2(masonrySize.x*6.283185,masonrySize.y)`:`(abs(normal.y)>.6 ? masonrySize.xz : (abs(normal.x)>.6 ? masonrySize.zy : masonrySize.xy))`}/vec2(4.,4.8);
            #ifdef USE_MAP
            vMapUv*=masonryRepeat;
            #endif
            #ifdef USE_NORMALMAP
            vNormalMapUv*=masonryRepeat;
            #endif
            #ifdef USE_ROUGHNESSMAP
            vRoughnessMapUv*=masonryRepeat;
            #endif`)},r.customProgramCacheKey=()=>`masonry-metres-${i}`}let i=new g(n,r,t.matrices.length);i.name=e,i.castShadow=!0,i.receiveShadow=!0,t.matrices.forEach((e,n)=>{i.setMatrixAt(n,e),i.setColorAt(n,t.colors[n])}),i.computeBoundingSphere(),this.root.add(i)}}};function Re(e,t){let n=new j;n.name=`Ten terraced districts and the crown cathedral`,e.add(n);let a=new Le(n),o=new L(1,1,1),s=new r(1,1,1,16),l=new se(1,1,8),u=new se(1,1,4);u.rotateY(Math.PI/4);let d=Ie(),f=Ie(!0),p=d.getAttribute(`uv`);for(let e=0;e<p.count;e++)p.setX(e,p.getX(e)+.5);let m=t.stone.clone();m.color.set(14537917);let h=t.rock.clone();h.color.set(4545889),h.roughness=.65;let g=t.window.clone();g.emissive.set(16760160),g.emissiveIntensity=.36;let _=(e,t,n)=>new i(e,t,n),v=e=>new X().setFromAxisAngle(_(0,1,0),e),y=(e,t,n,r,i,o=0,s=1)=>a.add(e,t,n,r,i,[`Recessed grand arcade openings`,`Carved gothic archivolts`,`Hundred floors of recessed windows`,`Window surrounds`].includes(e)?v(o).multiply(new X().setFromAxisAngle(_(1,0,0),-Math.atan(.55))):v(o),new c(s,s*.99,s*.96)),b=(e,t,n)=>_(Math.sin(e)*t,n,Math.cos(e)*t),x=(e,t,i,a,o,s)=>{let c=new r(i-.55*a,i,a,192,1,!0),l=c.getAttribute(`uv`);for(let e=0;e<l.count;e++)l.setXY(e,l.getX(e)*i*Pe/4,l.getY(e)*a/4.8);let u=new w(c,s);if(u.position.y=t+a/2,u.castShadow=u.receiveShadow=!0,u.name=e,n.add(u),o){let e=new w(new le(i-o,i,192),s),r=e.geometry.getAttribute(`position`),c=e.geometry.getAttribute(`uv`);for(let e=0;e<c.count;e++)c.setXY(e,r.getX(e)/4,r.getY(e)/4.8);e.rotation.x=-Math.PI/2,e.position.y=t+a,e.receiveShadow=!0,n.add(e)}};x(`Continuous inner castle mass behind the arcades`,80,455,540,0,m);for(let e=0;e<10;e++){let n=80+e*54,r=Fe(n);x(`District ${e+1} weathered retaining wall`,n,r-19,43,24,m),x(`Shadowed basal plinth`,n-.4,r+3.5,2.4,10,t.limestone),x(`Broad planted terrace`,n+48,Fe(n+48)+7,2.8,34,t.limestone);for(let e=1;e<10;e++)x(`Minor masonry cornice`,n+e*5.4,Fe(n+e*5.4)-18.4,.38,0,e%3==0?t.limestone:m);let i=72-e*3;for(let r=0;r<i;r++){let a=r/i*Pe,s=Fe(n+4)-5.65,c=.79+$(r,e+31)*.26;y(`Recessed grand arcade openings`,d,g,b(a,s,n+4),_(8,17,.8),a),y(`Carved gothic archivolts`,f,t.limestone,b(a,s+.5,n+4),_(8.5,18,1.8),a,c),y(`Arcade central mullions`,o,t.limestone,b(a,s+.8,n+11),_(.42,13,.9),a);for(let e of[-2.15,2.15]){let r=b(a,s+.8,n+10).add(_(Math.cos(a)*e,0,-Math.sin(a)*e));y(`Arcade slender mullions`,o,t.limestone,r,_(.24,11,.7),a)}y(`Arcade horizontal tracery`,o,t.limestone,b(a,Fe(n+12)-4.9,n+12),_(7.5,.35,.65),a);for(let i=5;i<9;i++){let o=n+i*5.4,s=Fe(o)-18.3;y(`Hundred floors of recessed windows`,d,g,b(a,s,o),_(2.1,3.2,1),a,.6+$(r+i,e)*.4),y(`Window surrounds`,f,t.limestone,b(a,s+.12,o-.1),_(2.5,3.5,.6),a,c)}let p=a+Math.PI/i;if(y(`Load-bearing tapered piers`,o,m,b(p,Fe(n+18)-1,n+19),_(1.8,34,6),p,c),y(`Carved capital blocks`,o,t.limestone,b(p,Fe(n+34),n+34),_(3.2,1.1,6.7),p),r%2==0){let i=n+48,s=7+$(r,e+2)*7,f=Fe(i+s)-3;y(`Terrace town houses`,o,m,b(a,f,i+s/2),_(7.2,s,9),a,c),y(`Clustered steep slate roofs`,u,h,b(a,f,i+s+4.5),_(6.4,9,8),a),y(`Townhouse glazed bays`,d,g,b(a,f+4.7,i+2),_(2.3,3.9,1),a),y(`Roof gilded finials`,l,t.gold,b(a,f,i+s+10),_(.24,2.8,.24),a),y(`Terrace cypress trees`,l,t.foliage,b(a+.014,Fe(i+9)-13,i+7),_(2.3,12,2.3),a)}}for(let r=0;r<12;r++){let i=r/12*Pe+e%2*.12,a=n+15,o=Fe(n+36)+6;y(`District bastion shafts`,s,m,b(i,o,a),_(7.5,30,7.5),i),y(`Bastion machicolations`,s,t.limestone,b(i,o,n+31),_(8.6,2.4,8.6),i),y(`Bastion slate spires`,l,h,b(i,o,n+40),_(8.8,17,8.8),i),y(`Golden bastion tips`,l,t.gold,b(i,o,n+50),_(.45,5,.45),i);for(let e=-1;e<=1;e++){let t=i+e*.045;y(`Bastion arrow slits`,d,g,b(t,o+7.4,n+18),_(1.3,6,1),t)}}}let S=new r(488,65,177,192,16),C=S.getAttribute(`position`);for(let e=0;e<C.count;e++){let t=C.getX(e),n=C.getY(e),r=C.getZ(e),i=Math.atan2(r,t),a=(Math.sin(i*17+n*.024)*6+Math.sin(i*41-n*.033)*4)*(1-(n+88.5)/177);C.setXYZ(e,t+Math.cos(i)*a,n+Math.sin(i*23)*3,r+Math.sin(i)*a)}S.computeVertexNormals();let T=new w(S,t.rock);T.position.y=-14,T.castShadow=T.receiveShadow=!0,n.add(T);let E=new M(1,1);for(let e=0;e<100;e++){let n=e/100*Pe,r=-25-$(e,73)*75,i=(65+(r+102)/177*423)*(.85+$(e,11)*.14);y(`Fractured floating rock strata`,E,t.rock,b(n,i,r),_(25+$(e,4)*24,22+$(e,9)*60,22),n)}x(`Grand foundation rim`,74,491,6,28,t.limestone),x(`Summit sanctuary terrace`,616,184,4,183,m);let D=(e,n,r,i,a,s=0)=>{y(`Cathedral limestone walls`,o,m,_(e,620+a/2,n),_(r,a,i),s),y(`Cathedral pitched roofs`,u,h,_(e,620+a+10,n),_(r*.76,24,i*.75),s);for(let c=-1;c<=1;c+=2)for(let u=0;u<6;u++){let p=_(c*(r/2+.15),12,-i/2+6+u*(i-12)/5).applyQuaternion(v(s)).add(_(e,620,n));y(`Cathedral lancet glass`,d,g,p,_(4,18,1),s+c*Math.PI/2),y(`Cathedral tracery`,f,t.limestone,p.clone().add(_(c*.3,0,0).applyQuaternion(v(s))),_(4.8,19,2),s+c*Math.PI/2);let m=_(c*(r/2+5),a*.43,-i/2+u*i/5).applyQuaternion(v(s)).add(_(e,620,n));y(`Cathedral flying buttresses`,o,t.limestone,m,_(2,a*.86,3),s),y(`Buttress pinnacles`,l,t.limestone,m.clone().add(_(0,a*.43+6,0)),_(2.4,12,2.4),s)}};D(0,0,40,142,44),D(0,0,30,119,37,Math.PI/2);for(let e=0;e<13;e++){let n=e/12*Pe,r=e===12,i=r?0:99,a=r?106:38+e%3*15,o=r?18:8;y(`Cathedral bell towers`,s,m,b(n,i,620+a/2),_(o,a,o),n),y(`Tower cornices`,s,t.limestone,b(n,i,620+a),_(o*1.13,3.2,o*1.13),n),y(`Cathedral needle roofs`,l,h,b(n,i,620+a+(r?35:20)),_(o*1.2,r?70:40,o*1.2),n),y(`Cathedral golden finials`,l,t.gold,b(n,i,620+a+(r?76:46)),_(.7,12,.7),n);for(let e=0;e<8;e++){let s=e/8*Pe,c=b(n,i,620+a-18).add(b(s,o+.2,0));y(`Bell tower openings`,d,g,c,_(r?4.5:2.6,13,1),s),y(`Bell tower frames`,f,t.limestone,c,_(r?5.2:3.2,14,1.5),s)}}a.finish()}var ze=class e extends w{constructor(t,n={}){super(t),this.isReflector=!0,this.type=`Reflector`,this.forceUpdate=!1,this._reflectionCameras=new WeakMap;let r=this,a=n.color===void 0?new c(8355711):new c(n.color),o=n.textureWidth||512,s=n.textureHeight||512,l=n.clipBias||0,u=n.shader||e.ReflectorShader,f=n.multisample===void 0?4:n.multisample,m=new pe,h=new i,g=new i,_=new i,v=new F,b=new i(0,0,-1),x=new K,S=new i,C=new i,w=new K,T=new F,E=new y(o,s,{samples:f,type:p}),D=new Z({name:u.name===void 0?`unspecified`:u.name,uniforms:d.clone(u.uniforms),fragmentShader:u.fragmentShader,vertexShader:u.vertexShader});D.uniforms.tDiffuse.value=E.texture,D.uniforms.color.value=a,D.uniforms.textureMatrix.value=T,this.material=D,this.onBeforeRender=function(e,t,n){let i=this.getReflectionCamera(n);if(g.setFromMatrixPosition(r.matrixWorld),_.setFromMatrixPosition(n.matrixWorld),v.extractRotation(r.matrixWorld),h.set(0,0,1),h.applyMatrix4(v),S.subVectors(g,_),S.dot(h)>0&&this.forceUpdate===!1)return;S.reflect(h).negate(),S.add(g),v.extractRotation(n.matrixWorld),b.set(0,0,-1),b.applyMatrix4(v),b.add(_),C.subVectors(g,b),C.reflect(h).negate(),C.add(g),i.position.copy(S),i.up.set(0,1,0),i.up.applyMatrix4(v),i.up.reflect(h),i.lookAt(C),i.far=n.far,i.updateMatrixWorld(),i.projectionMatrix.copy(n.projectionMatrix),T.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),T.multiply(i.projectionMatrix),T.multiply(i.matrixWorldInverse),T.multiply(r.matrixWorld),m.setFromNormalAndCoplanarPoint(h,g),m.applyMatrix4(i.matrixWorldInverse),x.set(m.normal.x,m.normal.y,m.normal.z,m.constant);let a=i.projectionMatrix;i.isOrthographicCamera?(w.x=(Math.sign(x.x)+a.elements[8])/a.elements[0],w.y=(Math.sign(x.y)+a.elements[9])/a.elements[5],w.z=-n.far,w.w=1):(w.x=(Math.sign(x.x)+a.elements[8])/a.elements[0],w.y=(Math.sign(x.y)+a.elements[9])/a.elements[5],w.z=-1,w.w=(1+a.elements[10])/a.elements[14]),x.multiplyScalar(2/x.dot(w)),a.elements[2]=x.x,a.elements[6]=x.y,i.isOrthographicCamera?(a.elements[10]=x.z-l,a.elements[14]=x.w-1):(a.elements[10]=x.z+1-l,a.elements[14]=x.w),r.visible=!1;let o=e.getRenderTarget(),s=e.xr.enabled,c=e.shadowMap.autoUpdate;e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(E),e.state.buffers.depth.setMask(!0),e.autoClear===!1&&e.clear(),e.render(t,i),e.xr.enabled=s,e.shadowMap.autoUpdate=c,e.setRenderTarget(o);let u=n.viewport;u!==void 0&&e.state.viewport(u),r.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return E},this.dispose=function(){E.dispose(),r.material.dispose()},this.getReflectionCamera=function(e){let t=this._reflectionCameras.get(e);return t===void 0&&(t=e.clone(),this._reflectionCameras.set(e,t)),t}}};ze.ReflectorShader={name:`ReflectorShader`,uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
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

		}`};function Be(e,t){let n=new z(1,1),r=new ze(n,{textureWidth:512,textureHeight:512,multisample:0,clipBias:.002,shader:{name:`Rain puddle with scene reflection and capillary ripples`,uniforms:{color:{value:new c(6716795)},tDiffuse:{value:null},textureMatrix:{value:new F},time:{value:0}},vertexShader:`uniform mat4 textureMatrix; varying vec4 projected; varying vec2 wetUv; varying vec3 eye; varying vec3 planeNormal;
        void main(){ wetUv=uv; projected=textureMatrix*vec4(position,1.); vec4 world=modelMatrix*vec4(position,1.); eye=cameraPosition-world.xyz; planeNormal=normalize(mat3(modelMatrix)*vec3(0.,0.,1.)); gl_Position=projectionMatrix*viewMatrix*world; }`,fragmentShader:`uniform sampler2D tDiffuse; uniform vec3 color; uniform float time; varying vec4 projected; varying vec2 wetUv; varying vec3 eye; varying vec3 planeNormal;
        void main(){
          vec2 p=wetUv*2.-1.; float a=atan(p.y,p.x); float edge=length(p)*(1.+.08*sin(a*7.)+.035*sin(a*13.));
          float alpha=(1.-smoothstep(.75,1.,edge)); if(alpha<.01)discard;
          vec2 ripple=vec2(sin(p.y*39.+time*1.6)+sin(p.x*25.-time),cos(p.x*32.+time*1.2))*.0009;
          vec3 n=normalize(planeNormal+vec3(ripple.x*22.,0.,ripple.y*22.));
          float fresnel=.10+.9*pow(1.-max(dot(normalize(eye),n),0.),4.);
          vec3 reflection=texture2D(tDiffuse,clamp(projected.xy/projected.w+ripple,vec2(.002),vec2(.998))).rgb;
          float glint=pow(max(dot(n,normalize(normalize(eye)+normalize(vec3(-.7,.53,.48)))),0.),320.);
          gl_FragColor=vec4(mix(color*.16,reflection,.68+fresnel*.28)+vec3(1.,.78,.43)*glint*1.7,alpha*(.58+fresnel*.38));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`}});r.name=`Shallow rainwater · live reflected castle and runners`;let a=r.material;a.transparent=!0,a.depthWrite=!1,a.polygonOffset=!0,a.polygonOffsetFactor=-1,r.renderOrder=2,e.add(r);let o=Q.slice(0,-1).flatMap((e,t)=>t%2==0&&![6,22,38,44,46,48,50,70,86].includes(t%96)?[{index:t,p:e.clone().lerp(Q[t+1],.24)}]:[]),s=r.onBeforeRender,l=null,u=!1,d=new K,f=new K;return r.onBeforeRender=(...e)=>{if(u||e[2]!==l||e[1].overrideMaterial)return;let n=e[0],i=t.visible,a=n.getScissorTest();n.getViewport(d),n.getScissor(f),u=!0,t.visible=!1;try{n.setScissorTest(!1),s.apply(r,e)}finally{t.visible=i,n.setViewport(d),n.setScissor(f),n.setScissorTest(a),u=!1}},{prepareCamera(e){l=e;let t=o[0],n=1/0;for(let r of o){let i=r.p.distanceToSquared(e.position);i<n&&(n=i,t=r)}if(r.visible=n<3025,!r.visible)return;let a=Q[t.index+1].clone().sub(Q[t.index]).normalize(),s=new i().crossVectors(new i(0,1,0),a).normalize(),c=new i().crossVectors(a,s).normalize();r.quaternion.setFromRotationMatrix(new F().makeBasis(s,a.clone().negate(),c)),r.position.copy(t.p).addScaledVector(c,.043).addScaledVector(s,t.index%4==0?-.85:.85),r.scale.set(4.6,9.5,1),r.updateMatrixWorld()},update(e){a.uniforms.time.value=e},setQuality(e,t){r.getRenderTarget().setSize(e&&!t?640:320,e&&!t?640:320)},dispose(){r.onBeforeRender=()=>{},r.removeFromParent(),r.dispose(),n.dispose()}}}var Ve=class e extends w{constructor(t,n={}){super(t),this.isRefractor=!0,this.type=`Refractor`,this.camera=new ue;let r=this,a=n.color===void 0?new c(8355711):new c(n.color),o=n.textureWidth||512,s=n.textureHeight||512,l=n.clipBias||0,u=n.shader||e.RefractorShader,f=n.multisample===void 0?4:n.multisample,m=this.camera;m.matrixAutoUpdate=!1,m.userData.refractor=!0;let h=new pe,g=new F,_=new y(o,s,{samples:f,type:p});this.material=new Z({name:u.name===void 0?`unspecified`:u.name,uniforms:d.clone(u.uniforms),vertexShader:u.vertexShader,fragmentShader:u.fragmentShader,transparent:!0}),this.material.uniforms.color.value=a,this.material.uniforms.tDiffuse.value=_.texture,this.material.uniforms.textureMatrix.value=g;let v=(function(){let e=new i,t=new i,n=new F,a=new i,o=new i;return function(i){return e.setFromMatrixPosition(r.matrixWorld),t.setFromMatrixPosition(i.matrixWorld),a.subVectors(e,t),n.extractRotation(r.matrixWorld),o.set(0,0,1),o.applyMatrix4(n),a.dot(o)<0}})(),b=(function(){let e=new i,t=new i,n=new X,a=new i;return function(){r.matrixWorld.decompose(t,n,a),e.set(0,0,1).applyQuaternion(n).normalize(),e.negate(),h.setFromNormalAndCoplanarPoint(e,t)}})(),x=(function(){let e=new pe,t=new K,n=new K;return function(r){m.matrixWorld.copy(r.matrixWorld),m.matrixWorldInverse.copy(m.matrixWorld).invert(),m.projectionMatrix.copy(r.projectionMatrix),m.far=r.far,e.copy(h),e.applyMatrix4(m.matrixWorldInverse),t.set(e.normal.x,e.normal.y,e.normal.z,e.constant);let i=m.projectionMatrix;n.x=(Math.sign(t.x)+i.elements[8])/i.elements[0],n.y=(Math.sign(t.y)+i.elements[9])/i.elements[5],n.z=-1,n.w=(1+i.elements[10])/i.elements[14],t.multiplyScalar(2/t.dot(n)),i.elements[2]=t.x,i.elements[6]=t.y,i.elements[10]=t.z+1-l,i.elements[14]=t.w}})();function S(e){g.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),g.multiply(e.projectionMatrix),g.multiply(e.matrixWorldInverse),g.multiply(r.matrixWorld)}function C(e,t,n){r.visible=!1;let i=e.getRenderTarget(),a=e.xr.enabled,o=e.shadowMap.autoUpdate;e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(_),e.autoClear===!1&&e.clear(),e.render(t,m),e.xr.enabled=a,e.shadowMap.autoUpdate=o,e.setRenderTarget(i);let s=n.viewport;s!==void 0&&e.state.viewport(s),r.visible=!0}this.onBeforeRender=function(e,t,n){n.userData.refractor!==!0&&v(n)&&(b(),S(n),x(n),C(e,t,n))},this.getRenderTarget=function(){return _},this.dispose=function(){_.dispose(),r.material.dispose()}}};Ve.RefractorShader={name:`RefractorShader`,uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`

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

		}`};function He(e){let t=new z(3100,2850),n=new ze(t,{textureWidth:512,textureHeight:512,clipBias:.002,multisample:0}),r=new Ve(t,{textureWidth:512,textureHeight:512,clipBias:.002,multisample:0}),i=[Me(),Me(2.7)],a=new F,o={...d.clone(xe.fog),reflectionMap:{value:n.getRenderTarget().texture},refractionMap:{value:r.getRenderTarget().texture},normalA:{value:i[0]},normalB:{value:i[1]},textureMatrix:{value:a},time:{value:0},tint:{value:new c(7050900)}},s=new Z({name:`AincradLakeReflectionRefraction`,uniforms:o,fog:!0,vertexShader:`
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
      }`}),l=new w(t,s);l.name=`Aincrad alpine lake · reflected and refracted`,l.rotation.x=-Math.PI/2,l.position.set(0,-205,470),l.renderOrder=1,e.add(l),n.matrixAutoUpdate=r.matrixAutoUpdate=!1;let u=!0,f=!1,p=new K,m=new K;return l.onBeforeRender=(...e)=>{if(!u||f||e[1].overrideMaterial)return;let[i,o,s]=e;if(s.position.y<l.position.y)return;f=!0,i.getViewport(p),i.getScissor(m);let c=i.getScissorTest(),d=i.getRenderTarget(),h=l.visible;try{a.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),a.multiply(s.projectionMatrix).multiply(s.matrixWorldInverse).multiply(l.matrixWorld),l.visible=!1,n.matrixWorld.copy(l.matrixWorld),r.matrixWorld.copy(l.matrixWorld),i.setScissorTest(!1),n.onBeforeRender(i,o,s,t,n.material,e[5]),r.onBeforeRender(i,o,s,t,r.material,e[5])}finally{l.visible=h,i.setRenderTarget(d),i.setViewport(p),i.setScissor(m),i.setScissorTest(c),f=!1}},{mesh:l,update(e){o.time.value=e},setQuality(e,t){let i=e&&!t?768:384;n.getRenderTarget().setSize(i,i),r.getRenderTarget().setSize(i,i)},setEnabled(e){u=e},dispose(){l.onBeforeRender=()=>{},e.remove(l),n.dispose(),r.dispose(),i.forEach(e=>e.dispose()),s.dispose(),t.dispose()}}}var Ue=Math.PI*2,We=N.clamp,Ge=Array.from({length:19},(e,t)=>{let n=t/19*Ue,r=2750+$(t,21)*1450;return{x:Math.cos(n)*r,z:Math.sin(n)*r,height:520+$(t,74)*1350,width:450+$(t,28)*530}});function Ke(e,t){let n=Oe(e/700+11,t/700+8),r=Oe(e/180-7,t/180+20),i=Math.hypot(e/1330,(t-440)/1310),a=N.smoothstep(i,.67,1.12),o=N.lerp(-86+r*19,-1+n*24+r*7,a);for(let n of Ge){let r=(e-n.x)/n.width,i=(t-n.z)/n.width,a=Math.atan2(i,r),s=Math.hypot(r*.83,i*1.12)*(1+Math.sin(a*5+n.x)*.19+Math.sin(a*11)*.08),c=Math.max(0,1-s/1.7);o+=n.height*c**2.4*(.48+Oe(e/160,t/160)*.98)}return o-180}function qe(e,t,n,r,i=!1){let a=new g(e,t,n);return a.castShadow=i,a.receiveShadow=!0,r.add(a),a}function Je(e,t,n,r,a,o=1,s=1,c=1,l=0,u=0){let d=new F().compose(new i(n,r,a),new X().setFromEuler(new m(0,l,u)),new i(o,s,c));e.setMatrixAt(t,d)}function Ye(e,t,n){let r=e.getAttribute(`uv`);for(let e=0;e<r.count;e++)r.setXY(e,r.getX(e)*t,r.getY(e)*n);return e}function Xe(){let e=new Uint8Array(65536);for(let t=0;t<128;t++)for(let n=0;n<128;n++){let r=(n/128-.5)*2,i=(t/128-.5)*2,a=Math.max(0,1-r*r-i*i*1.6),o=Oe(n/26,t/26),s=We((a*(.4+o)-.14)*1.85,0,1),c=206+We(i*29+o*35,0,49),l=(t*128+n)*4;e[l]=c,e[l+1]=Math.min(255,c+4),e[l+2]=Math.min(255,c+8),e[l+3]=s*205}let t=new G(e,128,128,B);return t.colorSpace=W,t.magFilter=h,t.minFilter=P,t.generateMipmaps=!0,t.needsUpdate=!0,t}function Ze(){let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`);t.fillStyle=`black`,t.fillRect(0,0,128,128),t.fillStyle=`white`;for(let e=0;e<17;e++){let n=20+$(e,71)*88,r=n+($(e,75)-.5)*49,i=24+$(e,79)*103;t.beginPath(),t.moveTo(n-2,128),t.quadraticCurveTo(n-3,128-i*.62,r,128-i),t.quadraticCurveTo(n+3,128-i*.56,n+2,128),t.fill()}let n=new o(e);return n.anisotropy=4,n}function Qe(e,t){let n=new j;n.name=`Aincrad · one hundred floating floors`,e.add(n);let o=new Set,s=new Set,l=je();for(let t of[...e.children])(t instanceof fe||t.name===`Aincrad sun target`)&&e.remove(t);e.background=new c(10995668),e.fog=new a(10399671,6e-5);let u=new Ee;u.name=`Aincrad atmospheric scattering`,u.scale.setScalar(7e3);let d=new i(-.7,.53,.48).normalize(),f=u.material.uniforms;f.turbidity.value=2.6,f.rayleigh.value=2.1,f.mieCoefficient.value=.003,f.mieDirectionalG.value=.76,f.cloudCoverage.value=.58,f.cloudDensity.value=.55,f.sunPosition.value.copy(d),u.material.fragmentShader=u.material.fragmentShader.replace(`gl_FragColor = vec4( texColor, 1.0 );`,`float skyLuminance = dot(texColor, vec3(0.2126, 0.7152, 0.0722));
     texColor *= 1.02 / (1.0 + skyLuminance);
     gl_FragColor = vec4(texColor, 1.0);`),n.add(u);let p=new te,m=u.clone();m.material=u.material.clone(),p.add(m);let h=new ge(t),_=h.fromScene(p,.015,.1,1e4);h.dispose(),m.material.dispose(),e.environment=_.texture,e.environmentIntensity=.4;let v=new A(13230833,6772544,.48);n.add(v);let y=new C(16768432,3.55);y.name=`Aincrad near-camera sunlight`,y.castShadow=!0,y.shadow.mapSize.set(2048,2048),Object.assign(y.shadow.camera,{left:-56,right:56,top:56,bottom:-56,near:.5,far:520}),y.shadow.bias=-15e-6,y.shadow.normalBias=.018,y.shadow.radius=1.3,n.add(y),n.add(y.target);let b=new C(11916519,.16);b.position.set(400,170,700),n.add(b),Re(n,l);let x=new z(9800,9800,280,280);x.rotateX(-Math.PI/2);let S=x.getAttribute(`position`),T=new Float32Array(S.count*3),E=new c(7570782),O=new c(9606803),k=new c(13951712),P=new c;for(let e=0;e<S.count;e++){let t=S.getX(e),n=S.getZ(e),r=Ke(t,n),i=Math.min(t-640,1460-t,n-1140,1780-n);S.setY(e,r-25*N.smoothstep(i,0,45));let a=Math.hypot(Ke(t+18,n)-r,Ke(t,n+18)-r)/18;P.copy(E).lerp(O,We(a*.75+(r-210)/850,0,1)),P.lerp(k,N.smoothstep(r+Oe(t/130,n/130)*130,510,790)*We(1.3-a*.42,0,1)),P.multiplyScalar(.83+Oe(t/120,n/120)*.3),T[e*3]=P.r,T[e*3+1]=P.g,T[e*3+2]=P.b}x.setAttribute(`color`,new ye(T,3)),x.computeVertexNormals(),Ye(x,580,580);let F=l.rock.clone();F.color.set(16777215),F.map=null,F.vertexColors=!0,F.normalScale.set(.3,.3),F.onBeforeCompile=e=>{e.vertexShader=`varying vec3 alpineWorld;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
 alpineWorld = (modelMatrix * vec4(transformed,1.0)).xyz;`),e.fragmentShader=`varying vec3 alpineWorld;
      float alpineHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float alpineNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(alpineHash(i),alpineHash(i+vec3(1,0,0)),f.x),mix(alpineHash(i+vec3(0,1,0)),alpineHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(alpineHash(i+vec3(0,0,1)),alpineHash(i+vec3(1,0,1)),f.x),mix(alpineHash(i+vec3(0,1,1)),alpineHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      `+e.fragmentShader,e.fragmentShader=e.fragmentShader.replace(`#include <color_fragment>`,`#include <color_fragment>
      float strata=alpineNoise(alpineWorld*vec3(.09,.16,.09))*.45+alpineNoise(alpineWorld*.033)*.35+alpineNoise(alpineWorld*.42)*.2;
      diffuseColor.rgb *= .66+strata*.49;`),e.fragmentShader=e.fragmentShader.replace(`#include <opaque_fragment>`,`float alpineHaze = smoothstep(950.,5200.,distance(cameraPosition,alpineWorld))*.53*(.45+.55*smoothstep(-50.,400.,alpineWorld.y));
      outgoingLight=mix(outgoingLight,vec3(.38,.52,.62),alpineHaze);
      #include <opaque_fragment>`)},F.customProgramCacheKey=()=>`alpine-strata-aerial-perspective-v2`,s.add(F);let ne=new w(x,F);ne.name=`Alpine grasslands, rocky ridges and snow`,ne.receiveShadow=!0,n.add(ne);let I=new z(820,640,75,65);I.rotateX(-Math.PI/2),I.translate(1050,0,1460);let L=I.getAttribute(`position`);for(let e=0;e<L.count;e++)L.setY(e,Ke(L.getX(e),L.getZ(e))+.15);I.computeVertexNormals(),Ye(I,120,92);let R=new w(I,l.grass);R.receiveShadow=!0,n.add(R);let B=new z(1.25,1.1,1,3);B.translate(0,.55,0);let re={value:0},V=new J({color:6848329,roughness:1,side:2,alphaTest:.46}),H=Ze();o.add(H),V.alphaMap=H,s.add(V),V.onBeforeCompile=e=>{e.uniforms.aincradWindTime=re,e.vertexShader=`uniform float aincradWindTime;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
      vec3 bladeWorld = (instanceMatrix * vec4(position, 1.0)).xyz;
      transformed.x += sin(aincradWindTime * 1.35 + bladeWorld.x * 0.035 + bladeWorld.z * 0.06) * position.y * position.y * 0.23;
      transformed.z += cos(aincradWindTime * 0.85 + bladeWorld.z * 0.05) * position.y * 0.09;`)},V.customProgramCacheKey=()=>`aincrad-grass-wind-v1`;let ie=qe(B,V,65e3,n);ie.name=`Wind-swept foreground grasses`;for(let e=0;e<ie.count;e++){let t=920+$(e,12)*310,n=1280+$(e,15)*320,r=.35+$(e,34)*.6;Je(ie,e,t,Ke(t,n)+.16,n,r,r,r,$(e,32)*Ue),ie.setColorAt(e,new c().setHSL(.18+$(e,54)*.03,.22,.48+$(e,64)*.2))}let U=ee(new M(1,3)),W=U.getAttribute(`position`);for(let e=0;e<W.count;e++){let t=.89+Math.sin(W.getX(e)*5+W.getY(e)*3)*Math.cos(W.getZ(e)*4)*.12;W.setXYZ(e,W.getX(e)*t,W.getY(e)*t,W.getZ(e)*t)}U.computeVertexNormals();let ae=qe(U,l.rock,85,n,!0),oe=qe(new r(.15,.3,1,6),l.bark,1500,n,!0),G=Ne();s.add(G.material),o.add(G.map);let K=qe(G.geometry,G.material,1500,n,!0);for(let e=0;e<1500;e++){let t=Math.floor(e/75),n=$(t,57)*Ue+($(e,58)-.5)*.32,r=1620+$(t,59)*700+($(e,61)-.5)*420,i=Math.sin(n)*r,a=Math.cos(n)*r,o=Ke(i,a),s=i>850&&i<1320&&a>1200&&a<1660?.001:10+$(e,62)*18;Je(oe,e,i,o+s*.22,a,s*.08,s*.44,s*.08),Je(K,e,i,o,a,s,s,s,n)}for(let e=0;e<ae.count;e++){let t=680+$(e,91)*880,n=1100+$(e,85)*720,r=.45+$(e,88)*5;Je(ae,e,t,Ke(t,n)+r*.36,n,r*1.4,r*.75,r,$(e,39)*Ue)}let se=Xe();o.add(se);let q=new D({map:se,transparent:!0,opacity:.33,depthWrite:!1,fog:!0,color:15921381});s.add(q);let ce=[];for(let e=0;e<42;e++){let t=e/42*Ue,r=e>=22,i=r?1100+$(e,10)*1350:540+$(e,51)*310,a=new be(q);a.position.set(Math.cos(t)*i,r?160+$(e,47)*280:-70+$(e,46)*110,Math.sin(t)*i);let o=r?620+$(e,76)*500:240+$(e,77)*200;a.scale.set(o,o*.38,1),n.add(a),ce.push({sprite:a,origin:a.position.clone(),phase:t})}let le=He(e),ue=Be(e,le.mesh),de=!1,Y=new i,pe=d.clone().multiplyScalar(175);return{sun:y,materials:l,trackMaterial:l.path,update(e,t){re.value=e,le.update(e),ue.update(e);for(let{sprite:t,origin:n,phase:r}of ce)t.position.x=n.x+Math.sin(e*.013+r)*12,t.position.y=n.y+Math.sin(e*.025+r*2)*3},prepareCamera(e){ue.prepareCamera(e),e.getWorldPosition(Y);let t=e.name===`Aincrad cinematic camera`,n=t&&Y.y>640,r=t||Math.hypot(Y.x,Y.z)>760,i=r?1-N.smoothstep(Y.y,-30,160):0;r?(y.target.position.set(0,n?690:295,0).lerp(Y,i),y.position.copy(y.target.position).addScaledVector(d,1650)):(y.position.copy(Y).add(pe),y.target.position.copy(Y));let a=r?N.lerp(n?240:680,65,i):34,o=y.shadow.camera;o.left=o.bottom=-a,o.right=o.top=a,o.far=r?3e3:360,y.shadow.bias=r?-45e-6:-15e-6,o.updateProjectionMatrix(),y.target.updateMatrixWorld(),y.updateMatrixWorld()},setQuality(e,t){le.setQuality(e,t),ue.setQuality(e,t),ie.visible=e,y.shadow.mapSize.set(e?2048:1024,e?2048:1024),y.shadow.map&&(y.shadow.map.dispose(),y.shadow.map=null)},dispose(){if(de)return;de=!0,ue.dispose(),le.dispose(),_.dispose(),e.environment=null;let t=new Set;n.traverse(e=>{if(e instanceof w){t.add(e.geometry),e instanceof g&&e.dispose();for(let t of Array.isArray(e.material)?e.material:[e.material])s.add(t)}}),y.shadow.dispose(),t.forEach(e=>e.dispose()),s.forEach(e=>e.dispose()),o.forEach(e=>e.dispose()),l.dispose(),n.removeFromParent(),n.clear()}}}var $e=class extends ae{segment;variant;phase=`warning`;heading;frame;warning;wasRolling=!1;cycle=-1;localTime=0;constructor(t,r,a,o,s,c=s){let l=Q[a].clone().lerp(Q[a+1],.55),d=new M(1.05,2),f=d.getAttribute(`position`);for(let e=0;e<f.count;e++){let t=f.getX(e),n=f.getY(e),r=f.getZ(e),i=1+Math.sin(t*9+r*7)*Math.cos(n*8)*.025;f.setXYZ(e,t*i,n*i,r*i)}d.computeVertexNormals(),super(t,r,{kind:`roller`,p:l.toArray(),size:[2.1,2.1,2.1],surface:`stone`},!0,!1,d,e.ColliderDesc.ball(1.05)),this.segment=a,this.variant=o,this.visual.material.dispose(),this.visual.material=c,this.visual.name=`Crossing boulder`,this.visual.castShadow=this.visual.receiveShadow=!0;let p=Q[a+1].clone().sub(Q[a]).normalize();this.heading=new i(0,1,0).cross(p).normalize();let m=p.clone().cross(this.heading).normalize();this.frame=new X().setFromRotationMatrix(new F().makeBasis(this.heading,m,p)),this.warning=new w(new z(9.4,.6),new n({color:16759892,transparent:!0,opacity:.48,depthWrite:!1})),this.warning.rotation.x=-Math.PI/2,this.warning.quaternion.premultiply(this.frame),this.warning.position.copy(l).addScaledVector(m,.055),r.add(this.warning),this.collider.setEnabled(!1);for(let e of[-1,1]){let t=new w(new L(1.6,2.6,3.2),s);t.quaternion.copy(this.frame),t.position.copy(l).add(new i(e*6.3,1.3,0).applyQuaternion(this.frame)),t.castShadow=t.receiveShadow=!0,r.add(t);let a=new w(new L(1.8,.28,3.6),new J({color:10060891,metalness:.55,roughness:.55}));a.quaternion.copy(this.frame),a.position.copy(t.position).addScaledVector(m,1.4),r.add(a);let o=this.frame.clone().multiply(new X().setFromAxisAngle(new i(0,1,0),-e*Math.PI/2)),c=new i(e*5.47,1.15,0).applyQuaternion(this.frame).add(l),d=new w(new u(1.11,32),new n({color:1515556}));d.quaternion.copy(o),d.position.copy(c),r.add(d);let f=new w(new ve(1.2,.16,8,32),s);f.quaternion.copy(o),f.position.copy(c).addScaledVector(this.heading,-e*.045),f.castShadow=!0,r.add(f)}}update(e,t,n){let r=12+this.variant%3,a=(e+this.variant*2.3)%r,o=Math.floor((e+this.variant*2.3)/r),s=a>=1.65&&a<5.7;this.phase=a<1.65?`warning`:s?`rolling`:`rest`,this.localTime=a,this.warning.visible=a<5.7,this.warning.material.opacity=s?.16:.26+Math.sin(a*12)*.16,this.visual.visible=s||a<1.65;let c=(this.variant+o)%2==0?1:-1,l=N.clamp((a-1.65)/4.05,0,1),u=new i(c*(6.7-13.4*l),1.1,0).applyQuaternion(this.frame).add(this.origin);(!s||!this.wasRolling||o!==this.cycle)&&(this.body.setTranslation(u,!0),this.previous.copy(u),this.velocity.set(0,0,0)),this.collider.setEnabled(s),s&&this.move(u,t),this.wasRolling=s,this.cycle=o}sync(){super.sync(),this.visual.quaternion.copy(this.frame).multiply(new X().setFromAxisAngle(new i(0,0,1),this.localTime*3))}impact(e){if(this.phase===`rolling`){for(let t of e)if(t.active&&t.machine.invincible<=0&&this.contact(t)){t.impact=8.5;let e=t.current.clone().sub(this.visual.position).setY(.5).normalize().multiplyScalar(3.2);t.body.applyImpulse(e,!0)}}}};function et(e,t,n,r){let i=n.clone();i.color.set(8420716),i.roughness=.91,i.normalScale.set(.9,.9);let a=r.clone();return a.color.set(9143670),a.roughness=.96,a.normalScale.set(1.2,1.2),Array.from({length:12},(n,r)=>new $e(e,t,Math.floor(r/2)*96+(r%2?59:3),r,i,a))}function tt(e,t){let n=new Le(e),r=new L(1,1,1),a=Ie(!0),o=t.clone();o.color.set(13024162),o.roughness=.87;let s=new J({color:8547653,metalness:.72,roughness:.4}),c=new J({color:3626580,metalness:.58,roughness:.62}),l=new J({color:3296860,side:2,roughness:1}),d=new z(1.2,3.5,6,14),f=d.getAttribute(`position`);for(let e=0;e<f.count;e++){let t=f.getY(e);f.setZ(e,Math.sin(t*3+f.getX(e)*3)*.12*(1.75-t)/3.5)}d.computeVertexNormals();let p=new R(1,12,8),m=new he({color:5002575,roughness:.17,metalness:.12,clearcoat:1,clearcoatRoughness:.1,transparent:!0,opacity:.28,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-1}),h=new u(1,24),g=h.getAttribute(`position`);for(let e=1;e<g.count;e++){let t=1+Math.sin(e*2.8)*.1;g.setXY(e,g.getX(e)*t,g.getY(e)*t)}let _=(e,t,n)=>new i(e,t,n);for(let e=0;e<Q.length-1;e++){let t=Q[e],i=Q[e+1].clone().sub(t).normalize(),u=_(0,1,0).cross(i).normalize(),f=i.clone().cross(u).normalize(),g=new X().setFromRotationMatrix(new F().makeBasis(u,f,i)),v=e=>e.applyQuaternion(g).add(t),y=(e,t,r,i,a,o=g)=>n.add(e,t,r,v(i),a,o),b=e%96>=44&&e%96<=50;if(e%2==0)for(let e of[-1,1]){y(`Bridge corbels`,r,o,_(e*4.5,-2.6,0),_(.9,4.4,1.4));let t=g.clone().multiply(new X().setFromAxisAngle(_(0,0,1),.9));y(`Stone cantilever braces`,r,o,_(16,-10.5,e*1.5),_(1.5,31,1.8),t),y(`Bracket ornamental bosses`,p,s,_(e*4.5,-1.3,-.76),_(.23,.23,.15))}if(!b&&e%4==0){for(let e of[-1,1])y(`Gothic gateway piers`,r,o,_(e*5.85,3.3,0),_(1.35,6.6,1.6)),y(`Gateway stepped bases`,r,o,_(e*5.85,.3,0),_(1.9,.6,2.2)),y(`Gateway capitals`,r,o,_(e*5.85,6.2,0),_(1.9,.4,2.2)),y(`Route ceremonial banners`,d,l,_(e*6.05,3.8,1.03),_(1,1,1)),y(`Banner gilded arms`,r,s,_(e*6.05,5.6,1.05),_(1.6,.085,.12));y(`Open gothic bridge archways`,a,o,_(0,0,-.45),_(13.2,10.7,5)),y(`Arch bronze outer relief`,a,c,_(0,.12,.55),_(13.3,10.8,.65)),y(`Arch keystone medallions`,p,s,_(0,10.05,1.15),_(.48,.7,.15))}if(!b&&![7,23,39,71,87].includes(e%96)){let t=g.clone().multiply(new X().setFromAxisAngle(_(1,0,0),-Math.PI/2));y(`Scattered wet flagstone patches`,h,m,_(e%2?2:-1,.028,8),_(1.1,2.2,1),t)}if([7,23,39,71,87].includes(e%96)){let n=t.distanceTo(Q[e+1]);for(let e of[-2.1,2.1])for(let t of[-1,1])y(`Broken bridge warning inlays`,r,s,_(t*3.5,.06,n/2+e),_(1.2,.04,.22))}}n.finish()}function nt(e){if(e.userData.aincradMetricUV)return;e.userData.aincradMetricUV=!0;let t=e.onBeforeCompile,n=e.customProgramCacheKey.bind(e)();e.onBeforeCompile=(n,r)=>{t.call(e,n,r),n.vertexShader=n.vertexShader.replace(`#include <common>`,`#include <common>
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
      #endif`)},e.customProgramCacheKey=()=>`${n}|aincrad-metric-stone-v1`,e.needsUpdate=!0}function rt(e){let t=``;for(let[n,r]of[[100,`C`],[90,`XC`],[50,`L`],[40,`XL`],[10,`X`],[9,`IX`],[5,`V`],[4,`IV`],[1,`I`]])for(;e>=n;)t+=r,e-=n;return t}function it(n,a,o,s=o){let l=new j;l.name=`Aincrad exterior spiral course`,l.userData.turns=we.turns,l.userData.routeSegments=Ce,a.add(l),tt(l,o);let u=new L(1,1,1);nt(o);let d=new J({color:4743006,metalness:.68,roughness:.52}),p=new J({color:11650237,metalness:.62,roughness:.42}),m=new J({color:16768672,emissive:16757583,emissiveIntensity:1.3,roughness:.28}),h=new Map;for(let[e,t]of[[o,`Instanced stone deck and balustrades`],[d,`Instanced patinated lantern frames`],[p,`Instanced silver route inlays`],[m,`Instanced lantern glass`]])h.set(e,{material:e,name:t,matrices:[],sizes:[],colors:[]});let _=new F,v=new i,y=new i,b=new X,x=new X,S=new X,C=new c(1,1,1),T=(e,t,n,r=S,i=C)=>{let a=h.get(e);y.set(...n),a.matrices.push(_.compose(t,r,y).clone()),a.sizes.push(...n),a.colors.push(i.clone())},E=(e,t,n,r,i,a)=>{v.set(...r).applyQuaternion(n).add(t),x.copy(n),a&&x.multiply(a),T(e,v,i,x)},D=(r,i,a=S)=>n.createCollider(e.ColliderDesc.cuboid(i[0]/2,i[1]/2,i[2]/2).setTranslation(r.x,r.y,r.z).setRotation(a).setFriction(.65).setCollisionGroups(t.terrain)),O=Te.obstacles.map(e=>{let t=ne(n,a,{...e,surface:`stone`});a.remove(t.visual),t.visual.geometry.dispose();for(let e of Array.isArray(t.visual.material)?t.visual.material:[t.visual.material])e.dispose();t.visual.geometry=u,t.visual.material=o,t.visual.scale.copy(t.size),t.visual.name=`Detached static obstacle reference`,b.copy(t.body.rotation());let r=t.size,i=r.y<.9;if(T(o,t.origin,[r.x,r.y,r.z],b,i?new c(.65,.72,.69):C),i||r.x>20)return t;let s=r.x<6,l=Math.max(.2,r.z-.16);for(let e of[-1,1]){let n=e*(r.x/2-.15);E(o,t.origin,b,[n,r.y/2+.095,0],[.3,.19,l]);let i=[.3,s?.19:1.08,l];if(v.set(n,r.y/2+i[1]/2,0).applyQuaternion(b).add(t.origin),D(v,i,b),s)continue;E(o,t.origin,b,[n,r.y/2+1.04,0],[.4,.2,l]);let a=Math.max(2,Math.ceil(l/3.4));for(let e=0;e<a;e++){let i=N.lerp(-l/2+.24,l/2-.24,e/(a-1));E(o,t.origin,b,[n,r.y/2+.53,i],[.21,.88,.21]),E(o,t.origin,b,[n,r.y/2+.2,i],[.38,.19,.38])}}return t}),k=new i(0,1,0),A=new i,M=new i,P=new i,ee=new F,te={I:[[0,-.35,0,.35]],V:[[-.2,.35,0,-.35],[0,-.35,.2,.35]],X:[[-.2,-.35,.2,.35],[-.2,.35,.2,-.35]],L:[[-.2,.35,-.2,-.35],[-.2,-.35,.2,-.35]],C:[[.2,.35,-.2,.35],[-.2,.35,-.2,-.35],[-.2,-.35,.2,-.35]]};for(let e=0;e<Q.length-1;e+=8){let t=Q[e];A.subVectors(Q[e+1],t).normalize(),M.crossVectors(k,A).normalize();let n=A.clone().cross(M).normalize();b.setFromRotationMatrix(ee.makeBasis(M,n,A));let r=e%we.segmentsPerTurn,a=r>=44&&r<=50?2.3:we.width/2;P.set(t.x,0,t.z).normalize();let s=t.clone().addScaledVector(P,a-.24),c=new X().setFromAxisAngle(k,Math.atan2(-P.x,-P.z));T(o,s.clone().add(new i(0,.25,0)),[.72,.5,.72],c),T(d,s.clone().add(new i(0,1.3,0)),[.14,2.1,.14],c),T(d,s.clone().add(new i(0,2.33,0)),[.7,.12,.7],c),T(m,s.clone().add(new i(0,2.72,0)),[.43,.64,.43],c);for(let e of[-.27,.27])for(let t of[-.27,.27])E(d,s,c,[e,2.72,t],[.055,.79,.055]);if(T(d,s.clone().add(new i(0,3.11,0)),[.72,.13,.72],c),D(s.clone().add(new i(0,1.2,0)),[.45,2.4,.45],c),e%16==0){let t=rt(Math.max(1,Math.round(e/Ce*100)));E(d,s,c,[0,1.75,.24],[Math.max(.95,t.length*.32+.2),.76,.1]);let n=.65;for(let e=0;e<t.length;e++)for(let[r,a,o,l]of te[t[e]]){let u=o-r,d=l-a,f=new X().setFromAxisAngle(new i(0,0,1),-Math.atan2(u,d));E(p,s,c,[(e-(t.length-1)/2)*.32+(r+o)*n/2,1.75+(a+l)*n/2,.302],[.035,Math.hypot(u,d)*n,.012],f)}}if(e>0)for(let e of[-1,1]){let n=new X().setFromAxisAngle(k,e*.62);E(p,t,b,[e*.22,.021,1.4],[.085,.018,.85],n)}}for(let e of h.values()){let t=e.material===o?u:u.clone();t.setAttribute(`courseScale`,new f(new Float32Array(e.sizes),3));let n=new g(t,e.material,e.matrices.length);n.name=e.name,n.castShadow=e.material!==m,n.receiveShadow=!0;for(let t=0;t<e.matrices.length;t++)n.setMatrixAt(t,e.matrices[t]),n.setColorAt(t,e.colors[t]);n.instanceMatrix.needsUpdate=!0,n.instanceColor&&(n.instanceColor.needsUpdate=!0),n.computeBoundingSphere(),l.add(n)}let[I,R,z]=Te.finish,B=new j;B.name=`Summit silver and teal crystal altar`,B.position.set(I,R-1,z),l.add(B);let re=new J({color:8096130,roughness:.93}),V=new w(new r(2.7,2.9,.18,48),re);V.position.y=.09,V.receiveShadow=!0,B.add(V),n.createCollider(e.ColliderDesc.cylinder(.09,2.8).setTranslation(I,R-.91,z).setCollisionGroups(t.terrain));for(let e of[1.65,2.6]){let t=new w(new ve(e,.035,6,64),p);t.rotation.x=Math.PI/2,t.position.y=.2,B.add(t)}let H=new j;H.name=`Aincrad summit crystal victory sensor`,H.position.set(I,R,z),a.add(H);let ie=new he({color:9096132,roughness:.13,metalness:.08,clearcoat:1,clearcoatRoughness:.09,emissive:2052430,emissiveIntensity:.22}),U=new w(new oe(.7),ie);U.scale.set(.82,1.45,.82),U.castShadow=!0,H.add(U);let W=new w(new ve(1.05,.035,6,64),p);W.rotation.x=Math.PI/2+.25,H.add(W);let ae=new ce(9360583,3,10,2);ae.position.y=1,H.add(ae);let G=n.createCollider(e.ColliderDesc.ball(1).setTranslation(...Te.finish).setSensor(!0).setCollisionGroups(t.trigger));return{obstacles:[...O,...et(n,a,o,s)],crown:{root:H,collider:G}}}var at=Math.PI*2,ot=[1160,1530],st=[980,1340],ct=Math.atan2(...st),lt=1780,ut=e=>{let t=N.clamp(e,0,1);return t*t*t*(t*(t*6-15)+10)},dt=class{meadowHeight;duration=76;camera=new ue(50,1,.5,1e4);target=new i;startPoint;elapsed=0;orbitAngle=0;currentShot=`meadow`;currentShotProgress=0;entryCamera=new i;entryTarget=new i;constructor(e=[0,80,512],t=()=>0){this.meadowHeight=t,this.startPoint=e instanceof i?e.clone():new i(...e),this.entryCamera.copy(this.startPoint).add(new i(-8,5,10)),this.entryTarget.copy(this.startPoint).add(new i(0,1,0)),this.camera.name=`Aincrad cinematic camera`,this.update(0,1)}get time(){return this.elapsed}get finished(){return this.elapsed>=this.duration}get frame(){let e={meadow:[`群山之上`,`穿過高山草原，尋找雲海中的浮遊城`],approach:[`艾因格朗特`,`一百層的天際，懸浮於雲與光之間`],orbit:[`環城巡禮`,`完整環視浮遊城，從基座仰望最高王座`],facade:[`天空聖堂`,`掠過層疊城區，仰望雲端的尖塔與彩窗`],arrival:[`向天空啟程`,`沿城外螺旋古道，一路攀向最頂端`]}[this.currentShot];return{shot:this.currentShot,label:e[0],subtitle:e[1],progress:this.elapsed/this.duration,shotProgress:this.currentShotProgress,time:this.elapsed,finished:this.finished,orbitRadians:this.orbitAngle,orbitDegrees:N.radToDeg(this.orbitAngle),position:this.camera.position.toArray(),target:this.target.toArray()}}update(e,t){this.elapsed=N.clamp(Number.isFinite(e)?e:0,0,this.duration),Number.isFinite(t)&&t>0&&(this.camera.aspect=t);let n=this.elapsed,r=this.camera;if(n<11){this.currentShot=`meadow`,this.currentShotProgress=n/11;let e=ut(this.currentShotProgress);r.position.set(N.lerp(ot[0],st[0],e),0,N.lerp(ot[1],st[1],e));let t=ut((n-3.5)/7.5);r.position.y=this.meadowHeight(r.position.x,r.position.z)+3.2+70.8*t,this.target.set(0,N.lerp(100,290,e),0),r.fov=N.lerp(55,48,e),this.orbitAngle=0}else if(n<17){this.currentShot=`approach`,this.currentShotProgress=(n-11)/6;let e=ut(this.currentShotProgress),t=N.lerp(Math.hypot(...st),lt,e);r.position.set(Math.sin(ct)*t,N.lerp(this.meadowHeight(...st)+74,360,e),Math.cos(ct)*t),this.target.set(0,N.lerp(290,315,e),0),r.fov=N.lerp(48,52,e),this.orbitAngle=0}else if(n<45){this.currentShot=`orbit`,this.currentShotProgress=(n-17)/28;let e=ut(this.currentShotProgress),t=Math.sin(Math.PI*e),i=lt-180*t;this.orbitAngle=at*e;let a=ct+this.orbitAngle;r.position.set(Math.sin(a)*i,360+80*e+110*t,Math.cos(a)*i),this.target.set(0,315+38*t,0),r.fov=52-3*t}else if(n<63){this.currentShot=`facade`,this.currentShotProgress=(n-45)/18;let e=ut(this.currentShotProgress),t=ct-.48*e,i=N.lerp(lt,410,e);r.position.set(Math.sin(t)*i,440+295*e,Math.cos(t)*i),this.target.set(0,N.lerp(315,700,e),0),r.fov=N.lerp(52,48,e),this.orbitAngle=at}else{this.currentShot=`arrival`,this.currentShotProgress=(n-63)/13;let e=ut(this.currentShotProgress),t=Math.atan2(this.entryCamera.x,this.entryCamera.z),i=Math.atan2(Math.sin(t-(ct-.48)),Math.cos(t-(ct-.48))),a=ct-.48+i*e,o=N.lerp(410,Math.hypot(this.entryCamera.x,this.entryCamera.z),e);r.position.set(Math.sin(a)*o,N.lerp(735,this.entryCamera.y,e),Math.cos(a)*o),this.target.set(0,700,0).lerp(this.entryTarget,ut(N.smoothstep(e,.15,1))),r.fov=N.lerp(48,55,e),this.orbitAngle=at}return r.updateProjectionMatrix(),r.lookAt(this.target),r.updateMatrixWorld(),this.frame}},ft={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`},pt=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},mt=new I(-1,1,1,-1,0,1),ht=new class extends E{constructor(){super(),this.setAttribute(`position`,new T([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new T([0,2,0,0,2,0],2))}},gt=class{constructor(e){this._mesh=new w(ht,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,mt)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},_t=class extends pt{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof Z?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=d.clone(e.uniforms),this.material=new Z({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new gt(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},vt=class extends pt{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},yt=class extends pt{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},bt=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new q);this._width=n.width,this._height=n.height,t=new y(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:p}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new _t(ft),this.copyPass.material.blending=0,this.timer=new s}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}vt!==void 0&&(r instanceof vt?n=!0:r instanceof yt&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new q);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},xt=class extends pt{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new c}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},St={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new c(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`},Ct=class e extends pt{constructor(e,t=1,r,a){super(),this.strength=t,this.radius=r,this.threshold=a,this.resolution=e===void 0?new q(256,256):new q(e.x,e.y),this.clearColor=new c(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let o=Math.round(this.resolution.x/2),s=Math.round(this.resolution.y/2);this.renderTargetBright=new y(o,s,{type:p}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new y(o,s,{type:p});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new y(o,s,{type:p});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),o=Math.round(o/2),s=Math.round(s/2)}let l=St;this.highPassUniforms=d.clone(l.uniforms),this.highPassUniforms.luminosityThreshold.value=a,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Z({uniforms:this.highPassUniforms,vertexShader:l.vertexShader,fragmentShader:l.fragmentShader}),this.separableBlurMaterials=[];let u=[6,10,14,18,22];o=Math.round(this.resolution.x/2),s=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(u[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new q(1/o,1/s),o=Math.round(o/2),s=Math.round(s/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let f=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=f,this.bloomTintColors=[new i(1,1,1),new i(1,1,1),new i(1,1,1),new i(1,1,1),new i(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=d.clone(ft.uniforms),this.blendMaterial=new Z({uniforms:this.copyUniforms,vertexShader:ft.vertexShader,fragmentShader:ft.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new c,this._oldClearAlpha=1,this._basic=new n,this._fsQuad=new gt(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new q(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(t,n,r,i,a){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this._fsQuad.render(t),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(r),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);return new Z({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new q(.5,.5)},direction:{value:new q(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

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

				}`})}_getCompositeMaterial(e){return new Z({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

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

				}`})}};Ct.BlurDirectionX=new q(1,0),Ct.BlurDirectionY=new q(0,1);var wt={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`},Tt=class extends pt{constructor(){super(),this.isOutputPass=!0,this.uniforms=d.clone(wt.uniforms),this.material=new H({name:wt.name,uniforms:this.uniforms,vertexShader:wt.vertexShader,fragmentShader:wt.fragmentShader}),this._fsQuad=new gt(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},x.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},Et={name:`FXAAShader`,uniforms:{tDiffuse:{value:null},resolution:{value:new q(1/1024,1/512)}},vertexShader:`

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

		}`},Dt=class extends _t{constructor(){super(Et)}setSize(e,t){this.material.uniforms.resolution.value.set(1/e,1/t)}},Ot={name:`GTAOShader`,defines:{PERSPECTIVE_CAMERA:1,SAMPLES:16,NORMAL_VECTOR_TYPE:1,DEPTH_SWIZZLING:`x`,SCREEN_SPACE_RADIUS:0,SCREEN_SPACE_RADIUS_SCALE:100,SCENE_CLIP_BOX:0},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new q},cameraNear:{value:null},cameraFar:{value:null},cameraProjectionMatrix:{value:new F},cameraProjectionMatrixInverse:{value:new F},cameraWorldMatrix:{value:new F},radius:{value:.25},distanceExponent:{value:1},thickness:{value:1},distanceFallOff:{value:1},scale:{value:1},sceneBoxMin:{value:new i(-1,-1,-1)},sceneBoxMax:{value:new i(1,1,1)}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		varying vec2 vUv;
		uniform highp sampler2D tNormal;
		uniform highp sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform mat4 cameraWorldMatrix;
		uniform float radius;
		uniform float distanceExponent;
		uniform float thickness;
		uniform float distanceFallOff;
		uniform float scale;
		#if SCENE_CLIP_BOX == 1
			uniform vec3 sceneBoxMin;
			uniform vec3 sceneBoxMax;
		#endif

		#include <common>
		#include <packing>

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(vec3(ao), 1.)
		#endif

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
			return textureLod(tDepth, uv.xy, 0.0).DEPTH_SWIZZLING;
		}

		float fetchDepth(const ivec2 uv) {
			return texelFetch(tDepth, uv.xy, 0).DEPTH_SWIZZLING;
		}

		float getViewZ(const in float depth) {
			#if PERSPECTIVE_CAMERA == 1
				return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
			#else
				return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ? ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz : -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ? ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz : -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
			#if NORMAL_VECTOR_TYPE == 2
				return normalize(textureLod(tNormal, uv, 0.).rgb);
			#elif NORMAL_VECTOR_TYPE == 1
				return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
			#else
				return computeNormalFromDepth(uv);
			#endif
		}

		vec3 getSceneUvAndDepth(vec3 sampleViewPos) {
			vec4 sampleClipPos = cameraProjectionMatrix * vec4(sampleViewPos, 1.);
			vec2 sampleUv = sampleClipPos.xy / sampleClipPos.w * 0.5 + 0.5;
			float sampleSceneDepth = getDepth(sampleUv);
			return vec3(sampleUv, sampleSceneDepth);
		}

		void main() {
			float depth = getDepth(vUv.xy);

			#ifdef USE_REVERSED_DEPTH_BUFFER
				if (depth <= 0.0) {
					discard;
					return;
				}
			#else
				if (depth >= 1.0) {
					discard;
					return;
				}
			#endif
			
			vec3 viewPos = getViewPosition(vUv, depth);
			vec3 viewNormal = getViewNormal(vUv);

			float radiusToUse = radius;
			float distanceFalloffToUse = thickness;
			#if SCREEN_SPACE_RADIUS == 1
				float radiusScale = getViewPosition(vec2(0.5 + float(SCREEN_SPACE_RADIUS_SCALE) / resolution.x, 0.0), depth).x;
				radiusToUse *= radiusScale;
				distanceFalloffToUse *= radiusScale;
			#endif

			#if SCENE_CLIP_BOX == 1
				vec3 worldPos = (cameraWorldMatrix * vec4(viewPos, 1.0)).xyz;
				float boxDistance = length(max(vec3(0.0), max(sceneBoxMin - worldPos, worldPos - sceneBoxMax)));
				if (boxDistance > radiusToUse) {
					discard;
					return;
				}
			#endif

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
			vec3 randomVec = noiseTexel.xyz * 2.0 - 1.0;
			vec3 tangent = normalize(vec3(randomVec.xy, 0.));
			vec3 bitangent = vec3(-tangent.y, tangent.x, 0.);
			mat3 kernelMatrix = mat3(tangent, bitangent, vec3(0., 0., 1.));

			const int DIRECTIONS = SAMPLES < 30 ? 3 : 5;
			const int STEPS = (SAMPLES + DIRECTIONS - 1) / DIRECTIONS;
			float ao = 0.0;
			for (int i = 0; i < DIRECTIONS; ++i) {

				float angle = float(i) / float(DIRECTIONS) * PI;
				vec4 sampleDir = vec4(cos(angle), sin(angle), 0., 0.5 + 0.5 * noiseTexel.w);
				sampleDir.xyz = normalize(kernelMatrix * sampleDir.xyz);

				vec3 viewDir = normalize(-viewPos.xyz);
				vec3 sliceBitangent = normalize(cross(sampleDir.xyz, viewDir));
				vec3 sliceTangent = cross(sliceBitangent, viewDir);
				vec3 normalInSlice = normalize(viewNormal - sliceBitangent * dot(viewNormal, sliceBitangent));

				vec3 tangentToNormalInSlice = cross(normalInSlice, sliceBitangent);
				vec2 cosHorizons = vec2(dot(viewDir, tangentToNormalInSlice), dot(viewDir, -tangentToNormalInSlice));

				for (int j = 0; j < STEPS; ++j) {
					vec3 sampleViewOffset = sampleDir.xyz * radiusToUse * sampleDir.w * pow(float(j + 1) / float(STEPS), distanceExponent);

					vec3 sampleSceneUvDepth = getSceneUvAndDepth(viewPos + sampleViewOffset);
					vec3 sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					vec3 viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.x += max(0., (sampleCosHorizon - cosHorizons.x) * mix(1., 2. / float(j + 2), distanceFallOff));
					}

					sampleSceneUvDepth = getSceneUvAndDepth(viewPos - sampleViewOffset);
					sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.y += max(0., (sampleCosHorizon - cosHorizons.y) * mix(1., 2. / float(j + 2), distanceFallOff));
					}
				}

				vec2 sinHorizons = sqrt(1. - cosHorizons * cosHorizons);
				float nx = dot(normalInSlice, sliceTangent);
				float ny = dot(normalInSlice, viewDir);
				float nxb = 1. / 2. * (acos(cosHorizons.y) - acos(cosHorizons.x) + sinHorizons.x * cosHorizons.x - sinHorizons.y * cosHorizons.y);
				float nyb = 1. / 2. * (2. - cosHorizons.x * cosHorizons.x - cosHorizons.y * cosHorizons.y);
				float occlusion = nx * nxb + ny * nyb;
				ao += occlusion;
			}

			ao = clamp(ao / float(DIRECTIONS), 0., 1.);
		#if SCENE_CLIP_BOX == 1
			ao = mix(ao, 1., smoothstep(0., radiusToUse, boxDistance));
		#endif
			ao = pow(ao, scale);

			gl_FragColor = FRAGMENT_OUTPUT;
		}`},kt={name:`GTAODepthShader`,defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform sampler2D tDepth;
		uniform float cameraNear;
		uniform float cameraFar;
		varying vec2 vUv;

		#include <packing>

		float getLinearDepth( const in vec2 screenPosition ) {
			#if PERSPECTIVE_CAMERA == 1
				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			#else
				return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		void main() {
			float depth = getLinearDepth( vUv );
			gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );

		}`},At={name:`GTAOBlendShader`,uniforms:{tDiffuse:{value:null},intensity:{value:1}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform float intensity;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = vec4(mix(vec3(1.), texel.rgb, intensity), texel.a);
		}`};function jt(e=5){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),n=Mt(t),r=n.length,a=new Uint8Array(r*4);for(let e=0;e<r;++e){let t=n[e],o=2*Math.PI*t/r,s=new i(Math.cos(o),Math.sin(o),0).normalize();a[e*4]=(s.x*.5+.5)*255,a[e*4+1]=(s.y*.5+.5)*255,a[e*4+2]=127,a[e*4+3]=255}let o=new G(a,t,t);return o.wrapS=de,o.wrapT=de,o.needsUpdate=!0,o}function Mt(e){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),n=t*t,r=Array(n).fill(0),i=Math.floor(t/2),a=t-1;for(let e=1;e<=n;){if(i===-1&&a===t?(a=t-2,i=0):(a===t&&(a=0),i<0&&(i=t-1)),r[i*t+a]!==0){a-=2,i++;continue}r[i*t+a]=e++,a++,i--}return r}var Nt={name:`PoissonDenoiseShader`,defines:{SAMPLES:16,SAMPLE_VECTORS:Pt(16,2,1),NORMAL_VECTOR_TYPE:1,DEPTH_VALUE_SOURCE:0},uniforms:{tDiffuse:{value:null},tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new q},cameraProjectionMatrixInverse:{value:new F},lumaPhi:{value:5},depthPhi:{value:5},normalPhi:{value:5},radius:{value:4},index:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`

		varying vec2 vUv;

		uniform sampler2D tDiffuse;
		uniform sampler2D tNormal;
		uniform sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform float lumaPhi;
		uniform float depthPhi;
		uniform float normalPhi;
		uniform float radius;
		uniform int index;

		#include <common>
		#include <packing>

		#ifndef SAMPLE_LUMINANCE
		#define SAMPLE_LUMINANCE dot(vec3(0.2125, 0.7154, 0.0721), a)
		#endif

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(denoised, 1.)
		#endif

		float getLuminance(const in vec3 a) {
			return SAMPLE_LUMINANCE;
		}

		const vec3 poissonDisk[SAMPLES] = SAMPLE_VECTORS;

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
		#if DEPTH_VALUE_SOURCE == 1
			return textureLod(tDepth, uv.xy, 0.0).a;
		#else
			return textureLod(tDepth, uv.xy, 0.0).r;
		#endif
		}

		float fetchDepth(const ivec2 uv) {
			#if DEPTH_VALUE_SOURCE == 1
				return texelFetch(tDepth, uv.xy, 0).a;
			#else
				return texelFetch(tDepth, uv.xy, 0).r;
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ?  ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz
									: -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ?  ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz
									: -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
		#if NORMAL_VECTOR_TYPE == 2
			return normalize(textureLod(tNormal, uv, 0.).rgb);
		#elif NORMAL_VECTOR_TYPE == 1
			return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
		#else
			return computeNormalFromDepth(uv);
		#endif
		}

		void denoiseSample(in vec3 center, in vec3 viewNormal, in vec3 viewPos, in vec2 sampleUv, inout vec3 denoised, inout float totalWeight) {
			vec4 sampleTexel = textureLod(tDiffuse, sampleUv, 0.0);
			float sampleDepth = getDepth(sampleUv);
			vec3 sampleNormal = getViewNormal(sampleUv);
			vec3 neighborColor = sampleTexel.rgb;
			vec3 viewPosSample = getViewPosition(sampleUv, sampleDepth);

			float normalDiff = dot(viewNormal, sampleNormal);
			float normalSimilarity = pow(max(normalDiff, 0.), normalPhi);
			float lumaDiff = abs(getLuminance(neighborColor) - getLuminance(center));
			float lumaSimilarity = max(1.0 - lumaDiff / lumaPhi, 0.0);
			float depthDiff = abs(dot(viewPos - viewPosSample, viewNormal));
			float depthSimilarity = max(1. - depthDiff / depthPhi, 0.);
			float w = lumaSimilarity * depthSimilarity * normalSimilarity;

			denoised += w * neighborColor;
			totalWeight += w;
		}

		void main() {
			float depth = getDepth(vUv.xy);
			vec3 viewNormal = getViewNormal(vUv);
			if (depth == 1. || dot(viewNormal, viewNormal) == 0.) {
				discard;
				return;
			}
			vec4 texel = textureLod(tDiffuse, vUv, 0.0);
			vec3 center = texel.rgb;
			vec3 viewPos = getViewPosition(vUv, depth);

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
      		vec2 noiseVec = vec2(sin(noiseTexel[index % 4] * 2. * PI), cos(noiseTexel[index % 4] * 2. * PI));
    		mat2 rotationMatrix = mat2(noiseVec.x, -noiseVec.y, noiseVec.x, noiseVec.y);

			float totalWeight = 1.0;
			vec3 denoised = texel.rgb;
			for (int i = 0; i < SAMPLES; i++) {
				vec3 sampleDir = poissonDisk[i];
				vec2 offset = rotationMatrix * (sampleDir.xy * (1. + sampleDir.z * (radius - 1.)) / resolution);
				vec2 sampleUv = vUv + offset;
				denoiseSample(center, viewNormal, viewPos, sampleUv, denoised, totalWeight);
			}

			if (totalWeight > 0.) {
				denoised /= totalWeight;
			}
			gl_FragColor = FRAGMENT_OUTPUT;
		}`};function Pt(e,t,n){let r=Ft(e,t,n),i=`vec3[SAMPLES](`;for(let t=0;t<e;t++){let n=r[t];i+=`vec3(${n.x}, ${n.y}, ${n.z})${t<e-1?`,`:`)`}`}return i}function Ft(e,t,n){let r=[];for(let a=0;a<e;a++){let o=2*Math.PI*t*a/e,s=(a/(e-1))**n;r.push(new i(Math.cos(o),Math.sin(o),s))}return r}var It=class{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(e.random()*256);this.perm=[];for(let e=0;e<512;e++)this.perm[e]=this.p[e&255];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}noise(e,t){let n,r,i,a=.5*(Math.sqrt(3)-1),o=(e+t)*a,s=Math.floor(e+o),c=Math.floor(t+o),l=(3-Math.sqrt(3))/6,u=(s+c)*l,d=s-u,f=c-u,p=e-d,m=t-f,h,g;p>m?(h=1,g=0):(h=0,g=1);let _=p-h+l,v=m-g+l,y=p-1+2*l,b=m-1+2*l,x=s&255,S=c&255,C=this.perm[x+this.perm[S]]%12,w=this.perm[x+h+this.perm[S+g]]%12,T=this.perm[x+1+this.perm[S+1]]%12,E=.5-p*p-m*m;E<0?n=0:(E*=E,n=E*E*this._dot(this.grad3[C],p,m));let D=.5-_*_-v*v;D<0?r=0:(D*=D,r=D*D*this._dot(this.grad3[w],_,v));let O=.5-y*y-b*b;return O<0?i=0:(O*=O,i=O*O*this._dot(this.grad3[T],y,b)),70*(n+r+i)}noise3d(e,t,n){let r,i,a,o,s=(e+t+n)*(1/3),c=Math.floor(e+s),l=Math.floor(t+s),u=Math.floor(n+s),d=1/6,f=(c+l+u)*d,p=c-f,m=l-f,h=u-f,g=e-p,_=t-m,v=n-h,y,b,x,S,C,w;g>=_?_>=v?(y=1,b=0,x=0,S=1,C=1,w=0):g>=v?(y=1,b=0,x=0,S=1,C=0,w=1):(y=0,b=0,x=1,S=1,C=0,w=1):_<v?(y=0,b=0,x=1,S=0,C=1,w=1):g<v?(y=0,b=1,x=0,S=0,C=1,w=1):(y=0,b=1,x=0,S=1,C=1,w=0);let T=g-y+d,E=_-b+d,D=v-x+d,O=g-S+2*d,k=_-C+2*d,A=v-w+2*d,j=g-1+3*d,M=_-1+3*d,N=v-1+3*d,P=c&255,F=l&255,ee=u&255,te=this.perm[P+this.perm[F+this.perm[ee]]]%12,ne=this.perm[P+y+this.perm[F+b+this.perm[ee+x]]]%12,I=this.perm[P+S+this.perm[F+C+this.perm[ee+w]]]%12,L=this.perm[P+1+this.perm[F+1+this.perm[ee+1]]]%12,R=.6-g*g-_*_-v*v;R<0?r=0:(R*=R,r=R*R*this._dot3(this.grad3[te],g,_,v));let z=.6-T*T-E*E-D*D;z<0?i=0:(z*=z,i=z*z*this._dot3(this.grad3[ne],T,E,D));let B=.6-O*O-k*k-A*A;B<0?a=0:(B*=B,a=B*B*this._dot3(this.grad3[I],O,k,A));let re=.6-j*j-M*M-N*N;return re<0?o=0:(re*=re,o=re*re*this._dot3(this.grad3[L],j,M,N)),32*(r+i+a+o)}noise4d(e,t,n,r){let i=this.grad4,a=this.simplex,o=this.perm,s=(Math.sqrt(5)-1)/4,c=(5-Math.sqrt(5))/20,l,u,d,f,p,m=(e+t+n+r)*s,h=Math.floor(e+m),g=Math.floor(t+m),_=Math.floor(n+m),v=Math.floor(r+m),y=(h+g+_+v)*c,b=h-y,x=g-y,S=_-y,C=v-y,w=e-b,T=t-x,E=n-S,D=r-C,O=w>T?32:0,k=w>E?16:0,A=T>E?8:0,j=w>D?4:0,M=T>D?2:0,N=+(E>D),P=O+k+A+j+M+N,F=+(a[P][0]>=3),ee=+(a[P][1]>=3),te=+(a[P][2]>=3),ne=+(a[P][3]>=3),I=+(a[P][0]>=2),L=+(a[P][1]>=2),R=+(a[P][2]>=2),z=+(a[P][3]>=2),B=+(a[P][0]>=1),re=+(a[P][1]>=1),V=+(a[P][2]>=1),H=+(a[P][3]>=1),ie=w-F+c,U=T-ee+c,W=E-te+c,ae=D-ne+c,oe=w-I+2*c,G=T-L+2*c,K=E-R+2*c,se=D-z+2*c,q=w-B+3*c,ce=T-re+3*c,le=E-V+3*c,J=D-H+3*c,ue=w-1+4*c,de=T-1+4*c,fe=E-1+4*c,Y=D-1+4*c,pe=h&255,me=g&255,he=_&255,X=v&255,ge=o[pe+o[me+o[he+o[X]]]]%32,Z=o[pe+F+o[me+ee+o[he+te+o[X+ne]]]]%32,_e=o[pe+I+o[me+L+o[he+R+o[X+z]]]]%32,ve=o[pe+B+o[me+re+o[he+V+o[X+H]]]]%32,ye=o[pe+1+o[me+1+o[he+1+o[X+1]]]]%32,be=.6-w*w-T*T-E*E-D*D;be<0?l=0:(be*=be,l=be*be*this._dot4(i[ge],w,T,E,D));let xe=.6-ie*ie-U*U-W*W-ae*ae;xe<0?u=0:(xe*=xe,u=xe*xe*this._dot4(i[Z],ie,U,W,ae));let Se=.6-oe*oe-G*G-K*K-se*se;Se<0?d=0:(Se*=Se,d=Se*Se*this._dot4(i[_e],oe,G,K,se));let Ce=.6-q*q-ce*ce-le*le-J*J;Ce<0?f=0:(Ce*=Ce,f=Ce*Ce*this._dot4(i[ve],q,ce,le,J));let we=.6-ue*ue-de*de-fe*fe-Y*Y;return we<0?p=0:(we*=we,p=we*we*this._dot4(i[ye],ue,de,fe,Y)),27*(l+u+d+f+p)}_dot(e,t,n){return e[0]*t+e[1]*n}_dot3(e,t,n,r){return e[0]*t+e[1]*n+e[2]*r}_dot4(e,t,n,r,i){return e[0]*t+e[1]*n+e[2]*r+e[3]*i}},Lt=class e extends pt{constructor(e,t,n=512,r=512,i,a,o){super(),this.width=n,this.height=r,this.clear=!0,this.camera=t,this.scene=e,this.output=0,this._renderGBuffer=!0,this._visibilityCache=[],this.blendIntensity=1,this.pdRings=2,this.pdRadiusExponent=2,this.pdSamples=16,this.gtaoNoiseTexture=jt(),this.pdNoiseTexture=this._generateNoise(),this.gtaoRenderTarget=new y(this.width,this.height,{type:p}),this.pdRenderTarget=this.gtaoRenderTarget.clone(),this.gtaoMaterial=new Z({defines:Object.assign({},Ot.defines),uniforms:d.clone(Ot.uniforms),vertexShader:Ot.vertexShader,fragmentShader:Ot.fragmentShader,blending:0,depthTest:!1,depthWrite:!1}),this.gtaoMaterial.defines.PERSPECTIVE_CAMERA=+!!this.camera.isPerspectiveCamera,this.gtaoMaterial.uniforms.tNoise.value=this.gtaoNoiseTexture,this.gtaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.normalMaterial=new re,this.normalMaterial.blending=0,this.pdMaterial=new Z({defines:Object.assign({},Nt.defines),uniforms:d.clone(Nt.uniforms),vertexShader:Nt.vertexShader,fragmentShader:Nt.fragmentShader,depthTest:!1,depthWrite:!1}),this.pdMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.pdMaterial.uniforms.tNoise.value=this.pdNoiseTexture,this.pdMaterial.uniforms.resolution.value.set(this.width,this.height),this.pdMaterial.uniforms.lumaPhi.value=10,this.pdMaterial.uniforms.depthPhi.value=2,this.pdMaterial.uniforms.normalPhi.value=3,this.pdMaterial.uniforms.radius.value=8,this.depthRenderMaterial=new Z({defines:Object.assign({},kt.defines),uniforms:d.clone(kt.uniforms),vertexShader:kt.vertexShader,fragmentShader:kt.fragmentShader,blending:0}),this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new Z({uniforms:d.clone(ft.uniforms),vertexShader:ft.vertexShader,fragmentShader:ft.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:208,blendDst:200,blendEquation:100,blendSrcAlpha:206,blendDstAlpha:200,blendEquationAlpha:100}),this.blendMaterial=new Z({uniforms:d.clone(At.uniforms),vertexShader:At.vertexShader,fragmentShader:At.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blending:5,blendSrc:208,blendDst:200,blendEquation:100,blendSrcAlpha:206,blendDstAlpha:200,blendEquationAlpha:100}),this._fsQuad=new gt(null),this._originalClearColor=new c,this.setGBuffer(i?i.depthTexture:void 0,i?i.normalTexture:void 0),a!==void 0&&this.updateGtaoMaterial(a),o!==void 0&&this.updatePdMaterial(o)}setSize(e,t){this.width=e,this.height=t,this.gtaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.pdRenderTarget.setSize(e,t),this.gtaoMaterial.uniforms.resolution.value.set(e,t),this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.pdMaterial.uniforms.resolution.value.set(e,t),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse)}dispose(){this.gtaoNoiseTexture.dispose(),this.pdNoiseTexture.dispose(),this.normalRenderTarget.dispose(),this.gtaoRenderTarget.dispose(),this.pdRenderTarget.dispose(),this.normalMaterial.dispose(),this.pdMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this._fsQuad.dispose()}get gtaoMap(){return this.pdRenderTarget.texture}setGBuffer(e,t){e===void 0?(this.depthTexture=new b,this.depthTexture.format=v,this.depthTexture.type=S,this.normalRenderTarget=new y(this.width,this.height,{minFilter:Y,magFilter:Y,type:p,depthTexture:this.depthTexture}),this.normalTexture=this.normalRenderTarget.texture,this._renderGBuffer=!0):(this.depthTexture=e,this.normalTexture=t,this._renderGBuffer=!1);let n=+!!this.normalTexture,r=this.depthTexture===this.normalTexture?`w`:`x`;this.gtaoMaterial.defines.NORMAL_VECTOR_TYPE=n,this.gtaoMaterial.defines.DEPTH_SWIZZLING=r,this.gtaoMaterial.uniforms.tNormal.value=this.normalTexture,this.gtaoMaterial.uniforms.tDepth.value=this.depthTexture,this.pdMaterial.defines.NORMAL_VECTOR_TYPE=n,this.pdMaterial.defines.DEPTH_SWIZZLING=r,this.pdMaterial.uniforms.tNormal.value=this.normalTexture,this.pdMaterial.uniforms.tDepth.value=this.depthTexture,this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture}setSceneClipBox(e){e?(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX!==1,this.gtaoMaterial.defines.SCENE_CLIP_BOX=1,this.gtaoMaterial.uniforms.sceneBoxMin.value.copy(e.min),this.gtaoMaterial.uniforms.sceneBoxMax.value.copy(e.max)):(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX===0,this.gtaoMaterial.defines.SCENE_CLIP_BOX=0)}updateGtaoMaterial(e){e.radius!==void 0&&(this.gtaoMaterial.uniforms.radius.value=e.radius),e.distanceExponent!==void 0&&(this.gtaoMaterial.uniforms.distanceExponent.value=e.distanceExponent),e.thickness!==void 0&&(this.gtaoMaterial.uniforms.thickness.value=e.thickness),e.distanceFallOff!==void 0&&(this.gtaoMaterial.uniforms.distanceFallOff.value=e.distanceFallOff,this.gtaoMaterial.needsUpdate=!0),e.scale!==void 0&&(this.gtaoMaterial.uniforms.scale.value=e.scale),e.samples!==void 0&&e.samples!==this.gtaoMaterial.defines.SAMPLES&&(this.gtaoMaterial.defines.SAMPLES=e.samples,this.gtaoMaterial.needsUpdate=!0),e.screenSpaceRadius!==void 0&&+!!e.screenSpaceRadius!==this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS&&(this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS=+!!e.screenSpaceRadius,this.gtaoMaterial.needsUpdate=!0)}updatePdMaterial(e){let t=!1;e.lumaPhi!==void 0&&(this.pdMaterial.uniforms.lumaPhi.value=e.lumaPhi),e.depthPhi!==void 0&&(this.pdMaterial.uniforms.depthPhi.value=e.depthPhi),e.normalPhi!==void 0&&(this.pdMaterial.uniforms.normalPhi.value=e.normalPhi),e.radius!==void 0&&e.radius!==this.radius&&(this.pdMaterial.uniforms.radius.value=e.radius),e.radiusExponent!==void 0&&e.radiusExponent!==this.pdRadiusExponent&&(this.pdRadiusExponent=e.radiusExponent,t=!0),e.rings!==void 0&&e.rings!==this.pdRings&&(this.pdRings=e.rings,t=!0),e.samples!==void 0&&e.samples!==this.pdSamples&&(this.pdSamples=e.samples,t=!0),t&&(this.pdMaterial.defines.SAMPLES=this.pdSamples,this.pdMaterial.defines.SAMPLE_VECTORS=Pt(this.pdSamples,this.pdRings,this.pdRadiusExponent),this.pdMaterial.needsUpdate=!0)}render(t,n,r){switch(this._renderGBuffer&&(this._overrideVisibility(),this._renderOverride(t,this.normalMaterial,this.normalRenderTarget,7829503,1),this._restoreVisibility()),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.gtaoMaterial.uniforms.cameraWorldMatrix.value.copy(this.camera.matrixWorld),this._renderPass(t,this.gtaoMaterial,this.gtaoRenderTarget,16777215,1),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this._renderPass(t,this.pdMaterial,this.pdRenderTarget,16777215,1),this.output){case e.OUTPUT.Off:break;case e.OUTPUT.Diffuse:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.AO:this.copyMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Denoise:this.copyMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Depth:this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this._renderPass(t,this.depthRenderMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n),this.blendMaterial.uniforms.intensity.value=this.blendIntensity,this.blendMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this._renderPass(t,this.blendMaterial,this.renderToScreen?null:n);break;default:console.warn(`THREE.GTAOPass: Unknown output type.`)}}_renderPass(e,t,n,r,i){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,r!=null&&(e.setClearColor(r),e.setClearAlpha(i||0),e.clear()),this._fsQuad.material=t,this._fsQuad.render(e),e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_renderOverride(e,t,n,r,i){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,r=t.clearColor||r,i=t.clearAlpha||i,r!=null&&(e.setClearColor(r),e.setClearAlpha(i||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_overrideVisibility(){let e=this.scene,t=this._visibilityCache;e.traverse(function(e){(e.isPoints||e.isLine||e.isLine2)&&e.visible&&(e.visible=!1,t.push(e))})}_restoreVisibility(){let e=this._visibilityCache;for(let t=0;t<e.length;t++)e[t].visible=!0;e.length=0}_generateNoise(e=64){let t=new It,n=e*e*4,r=new Uint8Array(n);for(let n=0;n<e;n++)for(let i=0;i<e;i++){let a=n,o=i;r[(n*e+i)*4]=(t.noise(a,o)*.5+.5)*255,r[(n*e+i)*4+1]=(t.noise(a+e,o)*.5+.5)*255,r[(n*e+i)*4+2]=(t.noise(a,o+e)*.5+.5)*255,r[(n*e+i)*4+3]=(t.noise(a+e,o+e)*.5+.5)*255}let i=new G(r,e,e,B,l);return i.wrapS=de,i.wrapT=de,i.needsUpdate=!0,i}};Lt.OUTPUT={Off:-1,Default:0,Diffuse:1,Depth:2,Normal:3,AO:4,Denoise:5};var Rt=class{renderer;composer;renderPass;bloom;ao;output=new Tt;fxaa=new Dt;copyMaterial=new Z({name:`Aincrad screen composite`,uniforms:{tDiffuse:{value:null}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,fragmentShader:`uniform sampler2D tDiffuse; varying vec2 vUv; void main(){
        vec3 c=texture2D(tDiffuse,vUv).rgb;
        float l=dot(c,vec3(.2126,.7152,.0722));
        c+=vec3(.013,.002,-.008)*smoothstep(.35,.9,l)+vec3(-.005,.002,.009)*(1.-smoothstep(.1,.45,l));
        vec2 p=vUv*2.-1.; float vignette=1.-.11*dot(p*.65,p*.65);
        float grain=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.003;
        gl_FragColor=vec4(c*vignette+grain,1.);
      }`,depthTest:!1,depthWrite:!1,blending:0,toneMapped:!1});copy=new gt(this.copyMaterial);viewport=new K;scissor=new K;width=0;height=0;disposed=!1;constructor(e,t,n){this.renderer=e;let r=new y(8,8,{type:p,depthBuffer:!0,stencilBuffer:!1});r.texture.name=`Aincrad HDR`,this.composer=new bt(e,r),this.composer.setPixelRatio(1),this.composer.renderToScreen=!1,this.renderPass=new xt(t,n),this.ao=new Lt(t,n,8,8),this.ao.blendIntensity=.62,this.ao.updateGtaoMaterial({radius:2.4,thickness:1.5,distanceFallOff:1,samples:12,screenSpaceRadius:!1}),this.ao.updatePdMaterial({radius:4,samples:8,rings:2});let i=this.ao.render.bind(this.ao);this.ao.render=(...e)=>{let t=[];this.ao.scene.traverse(e=>{if(!e.visible)return;let n=e,r=n.material?Array.isArray(n.material)?n.material:[n.material]:[];(e instanceof be||r.some(e=>e.transparent||e.alphaTest>0||e instanceof Z))&&(t.push(e),e.visible=!1)});try{i(...e)}finally{t.forEach(e=>e.visible=!0)}},this.bloom=new Ct(new q(8,8),.16,.42,1.15),this.composer.addPass(this.renderPass),this.composer.addPass(this.ao),this.composer.addPass(this.bloom),this.composer.addPass(this.output),this.composer.addPass(this.fxaa)}render(e,t,n,r,i=0,a=`high`){if(this.disposed)return;let o=this.renderer,s=Math.min(o.getPixelRatio(),a===`high`?1.5:1),c=Math.max(8,Math.ceil(n*s/8)*8),l=Math.max(8,Math.ceil(r*s/8)*8);(c!==this.width||l!==this.height)&&(this.width=c,this.height=l,this.composer.setSize(c,l),this.ao.setSize(Math.ceil(c/2),Math.ceil(l/2))),this.renderPass.scene=e,this.renderPass.camera=t,this.ao.camera=t,this.ao.scene=e,this.ao.enabled=a===`high`,this.ao.updateGtaoMaterial({radius:t.name===`Aincrad cinematic camera`?12:2.4,thickness:t.name===`Aincrad cinematic camera`?5:1.5}),this.bloom.enabled=a===`high`,o.getViewport(this.viewport),o.getScissor(this.scissor);let u=o.getRenderTarget(),d=o.getScissorTest(),f=o.autoClear,p=o.toneMapping,m=o.toneMappingExposure;try{o.setScissorTest(!1),o.autoClear=!0,o.toneMapping=6,o.toneMappingExposure=1.03,this.composer.render(i),o.setRenderTarget(u),o.setViewport(this.viewport),o.setScissor(this.scissor),o.setScissorTest(d),o.autoClear=!1,this.copyMaterial.uniforms.tDiffuse.value=this.composer.readBuffer.texture,this.copy.render(o)}finally{o.setRenderTarget(u),o.setViewport(this.viewport),o.setScissor(this.scissor),o.setScissorTest(d),o.autoClear=f,o.toneMapping=p,o.toneMappingExposure=m}}dispose(){this.disposed||(this.disposed=!0,this.bloom.dispose(),this.ao.dispose(),this.ao.gtaoMaterial.dispose(),this.ao.blendMaterial.dispose(),this.output.dispose(),this.fxaa.dispose(),this.composer.dispose(),this.copyMaterial.dispose(),this.copy.dispose())}},zt=[{name:`銀葉巡林者`,color:5005910,accent:12427632,hair:13154711,skin:13147779},{name:`緋暮旅人`,color:6768201,accent:11049343,hair:3549217,skin:12159345},{name:`霧峰斥候`,color:5399403,accent:10987674,hair:10194039,skin:14070425},{name:`苔谷守望者`,color:6841672,accent:11638630,hair:4076582,skin:10252631},{name:`月河尋路人`,color:5198699,accent:10726574,hair:11842730,skin:13080703},{name:`琥珀遊俠`,color:7954758,accent:12756852,hair:7159856,skin:11830372}];function Bt(e,t=24){let n=[],r=[],i=[];e.forEach(([a,o,s,c=0],l)=>{for(let u=0;u<=t;u++){let d=u/t*Math.PI*2;if(n.push(Math.sin(d)*o,a,Math.cos(d)*s+c),r.push(u/t,l/(e.length-1)),l&&u){let e=l*(t+1)+u;i.push(e,e-1,e-t-2,e,e-t-2,e-t-1)}}});let a=new E;return a.setAttribute(`position`,new T(n,3)),a.setAttribute(`uv`,new T(r,2)),a.setIndex(i),a.computeVertexNormals(),a}function Vt(e,t,n=6,r=12){return new k(new O(e.map(([e,t,n])=>new i(e,t,n))),r,t,n,!1)}function Ht(e,t=!1){let n=t?[[.129,.914,-.042],[.335,1.008,-.031],[.193,.901,-.052],[.14,.885,-.05]]:[[.114,.936,.002],[.375,1.035,-.013],[.224,.886,-.003],[.138,.865,.006]],r=n.flatMap(([n,r,i])=>[n*e,r,i-(t?.002:.048)]);t||r.push(...n.flatMap(([t,n,r])=>[t*e,n,r+.018]));let i=new E,a=t?[0,1,2,0,2,3]:[0,1,2,0,2,3,6,5,4,7,6,4,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0];if(i.setAttribute(`position`,new T(r,3)),i.setAttribute(`uv`,new T(Array(r.length/3).fill([0,0]).flat(),2)),e<0)for(let e=0;e<a.length;e+=3)[a[e],a[e+2]]=[a[e+2],a[e]];return i.setIndex(a),i.computeVertexNormals(),i}function Ut(){let e=new Uint8Array(16384);for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=(t*64+n)*4,i=(n*29+t*31+n*t*3)%13-6,a=205+(n%4<2?19:0)+(t%4<2?15:0)+i;e[r]=e[r+1]=e[r+2]=a,e[r+3]=255}let t=new G(e,64,64,B);return t.wrapS=t.wrapT=de,t.repeat.set(5,5),t.magFilter=t.minFilter=h,t.needsUpdate=!0,t}function Wt(e){e.updateMatrixWorld(!0);let t=e.matrixWorld.clone().invert(),n=new Map,r=new Set;e.traverse(e=>{if(!(e instanceof w)||Array.isArray(e.material))return;let i=e.geometry.index?e.geometry.toNonIndexed():e.geometry.clone();i.applyMatrix4(t.clone().multiply(e.matrixWorld));let a=n.get(e.material)??[];a.push(i),n.set(e.material,a),r.add(e.geometry)}),e.clear();for(let[t,r]of n){let n=ie(r);n&&V(e,n,t),r.forEach(e=>e.dispose())}r.forEach(e=>e.dispose())}var Gt=class{id;root=new j;rig=new j;limbs=[];eyes=new j;marker;materials=[];opacity=1;skin;head=new j;elbows=[];knees=[];cloak;cloakBase;cloakFrame=0;targetRotation=new X;targetEuler=new m(0,0,0,`YXZ`);constructor(e,t,n=e%10){this.id=e;let i=zt[(n%zt.length+zt.length)%zt.length];this.skin={name:i.name,color:i.color,accent:i.accent,type:`elf`},this.root.name=`castle-exclusive-elf`,this.root.userData.costume=i.name,this.root.userData.appearance=`elf`,this.root.add(this.rig);let a=Ut(),o=(e,t=.8,n=0)=>new J({color:e,roughness:t,metalness:n}),s=new he({color:i.skin,roughness:.62,metalness:0,sheen:.16,sheenColor:14990245,sheenRoughness:.85}),l=o(new c(i.skin).multiplyScalar(.8).getHex(),.74);l.side=2;let u=o(i.color,.93);u.map=a,u.bumpMap=a,u.bumpScale=.009;let d=o(4601643,.73);d.bumpMap=a,d.bumpScale=.004;let f=o(2959652,.83),p=o(i.accent,.41,.72),m=o(9601642,.9),h=o(i.hair,.72),g=o(new c(i.hair).lerp(new c(13219488),.23).getHex(),.69),_=o(4215626,.4),v=o(1120021,.3),y=o(12762026,.44),b=o(new c(i.skin).lerp(new c(7225401),.5).getHex(),.85),x=(e,t=20,n=12)=>new R(e,t,n),S=new j;this.rig.add(S),V(S,Bt([[-.11,.14,.088],[-.025,.157,.105],[.15,.123,.093],[.37,.18,.116],[.49,.209,.105],[.55,.173,.08],[.6,.061,.058]]),u),V(S,Bt([[.115,.133,.106],[.23,.14,.113],[.405,.19,.126],[.5,.195,.11]]),d),V(S,new r(.05,.059,.145,16),s,[0,.635,0]),V(S,Bt([[.565,.075,.066],[.64,.063,.058]]),u);let C=V(S,new ve(.069,.008,5,24),m,[0,.639,0]);C.rotation.x=Math.PI/2,C.scale.y=.86;for(let e=0;e<5;e++){let t=.27+e*.045;V(S,Vt([[-.022,t,-.126],[.024,t+.032,-.13]],.0032,4,1),m),V(S,Vt([[.022,t,-.126],[-.024,t+.032,-.13]],.0032,4,1),m)}let E=V(S,U(.048,.59,.025,.009),f,[-.01,.315,-.138]);E.rotation.z=-.47;let D=V(S,U(.067,.075,.031,.004),p,[-.042,.4,-.156]);D.rotation.z=-.47,V(S,U(.027,.04,.015,.003),f,[-.042,.4,-.178]).rotation.z=-.47,V(S,Bt([[.065,.162,.116],[.135,.146,.116]]),f),V(S,U(.086,.066,.02,.006),p,[0,.1,-.125]),V(S,U(.057,.039,.025,.002),d,[0,.1,-.138]),V(S,new L(.007,.047,.008),p,[0,.1,-.154]);for(let e of[-1,1]){let t=V(S,U(.132,.28,.046,.015),u,[e*.081,-.083,-.086]);t.rotation.z=e*.11;let n=V(S,U(.007,.235,.012,.002),m,[e*.138,-.083,-.112]);n.rotation.z=e*.11,V(S,U(.13,.12,.08,.015),d,[e*.18,.07,0]),V(S,U(.115,.038,.084,.01),f,[e*.18,.105,-.003]),V(S,x(.011,8,6),p,[e*.18,.079,-.045]),V(S,x(.104),d,[e*.21,.495,.006],[1.08,.72,1.22]),V(S,x(.098),p,[e*.218,.515,.003],[1.08,.38,1.21]);for(let t of[-.082,.074])V(S,x(.008,8,6),p,[e*.236,.502,t]);V(S,x(.025,12,8),p,[e*.13,.515,-.105],[1,1,.35])}Wt(S),this.rig.add(this.head);let O=new j;this.head.add(O,this.eyes),V(O,Bt([[.698,.021,.032,-.019],[.724,.061,.071,-.006],[.765,.09,.096,.003],[.821,.117,.114,.003],[.887,.125,.121,.002],[.96,.119,.123,.006],[1.019,.09,.105,.016],[1.046,.014,.026,.018]],32),s);for(let e of[-1,1]){V(O,Ht(e),s),V(O,Ht(e,!0),l),V(O,x(.041,16,10),s,[e*.081,.834,-.085],[1,.52,.53]);let t=V(O,x(.039,16,10),s,[e*.054,.927,-.103],[1.2,.35,.35]);t.rotation.z=e*-.13,V(O,Vt([[e*.023,.934,-.117],[e*.052,.941,-.119],[e*.087,.931,-.107]],.0043,5,6),h),V(O,Vt([[e*.019,.907,-.12],[e*.052,.919,-.127],[e*.089,.906,-.107]],.0027,4,6),b),V(this.eyes,x(.036,16,10),y,[e*.053,.905,-.111],[1,.32,.4]),V(this.eyes,x(.011,12,8),_,[e*.049,.905,-.125],[.94,1,.31]),V(this.eyes,x(.005,10,6),v,[e*.049,.905,-.129],[.85,1,.38]),V(this.eyes,x(.0019,8,6),y,[e*.049-.002,.909,-.132])}V(O,x(.032,16,12),s,[0,.873,-.12],[.48,1.7,.72]),V(O,x(.021,16,10),s,[0,.838,-.145],[.7,.66,.89]);for(let e of[-1,1])V(O,x(.012,12,8),s,[e*.015,.832,-.134],[.8,.6,.8]);V(O,Vt([[-.033,.788,-.092],[-.012,.791,-.107],[0,.787,-.109],[.012,.791,-.107],[.033,.788,-.092]],.003,5,10),b),V(O,x(.027,16,8),s,[0,.768,-.08],[1.05,.33,.35]),V(O,new R(1,28,16,0,Math.PI*2,0,Math.PI*.6),h,[0,.966,.021],[.136,.112,.137]),V(O,x(.125,20,12),h,[0,.938,.07],[.95,1.07,.67]);for(let e=0;e<14;e++){let t=e/13*Math.PI*1.45-Math.PI*.225,n=Math.sin(t),r=Math.cos(t);V(O,Vt([[n*.035,1.071,.032+r*.022],[n*.109,1.035,.023+r*.094],[n*.136,.959,.023+r*.128]],.0034,4,8),g)}for(let e=0;e<7;e++){let t=e*.011;V(O,Vt([[.086-t,1.054,-.035],[.022-t,1.065,-.106],[-.065-t*.72,1.015-t*.22,-.131],[-.11-t*.1,.953-t*.55,-.089]],.009-e*5e-4,6,12),e%3?h:g)}for(let e of[-1,1]){V(O,Vt([[e*.118,.991,.011],[e*.141,.92,.024],[e*.145,.808,.043],[e*.105,.708,.066]],.021,7,12),h);for(let t=0;t<8;t++)V(O,x(.018,12,8),t%2?h:g,[e*(.13+Math.sin(t*2.3)*.012),.84-t*.024,.053],[.7,1,.8]);let t=V(O,new ve(.013,.004,5,10),p,[e*.131,.666,.053]);t.rotation.x=Math.PI/2}Wt(O),Wt(this.eyes),this.eyes.children.forEach(e=>e.position.y-=.905),this.eyes.position.y=.905;for(let e of[-1,1]){let t=new j;t.position.set(e*.232,.482,0);let n=new j;V(n,new _e(.065,.165,6,14),u,[0,-.108,0],[1,1,.94]),V(n,new r(.068,.064,.044,14),d,[0,-.155,0]),Wt(n);let i=new j;i.position.y=-.245,V(i,new _e(.051,.15,6,14),u,[0,-.095,0]),V(i,Bt([[-.205,.044,.045],[-.17,.061,.052],[-.055,.054,.051]]),d),V(i,U(.056,.126,.024,.01),p,[0,-.12,-.049]);for(let e of[-.065,-.176])V(i,new r(.057,.056,.018,14),f,[0,e,0]);V(i,x(.043,14,10),s,[0,-.239,-.004],[.82,1.34,.59]),V(i,x(.016,10,8),s,[-e*.036,-.226,-.009],[.8,1.65,.85]),V(i,U(.059,.065,.024,.009),f,[0,-.223,.014]),Wt(i),t.add(n,i),this.rig.add(t),this.limbs.push(t),this.elbows.push(i)}for(let e of[-1,1]){let t=new j;t.position.set(e*.086,-.02,0);let n=new j;V(n,new _e(.074,.158,6,16),u,[0,-.134,0],[.94,1,1]),V(n,new r(.07,.063,.039,14),f,[0,-.177,0]),Wt(n);let i=new j;i.position.y=-.29,V(i,new _e(.051,.17,6,14),u,[0,-.137,0]),V(i,x(.059,14,10),d,[0,-.014,-.033],[.87,.86,.6]),V(i,Bt([[-.353,.064,.066],[-.25,.059,.06],[-.16,.065,.067],[-.125,.061,.063]]),d),V(i,new r(.068,.067,.025,14),f,[0,-.137,0]),V(i,x(.071,18,10),d,[0,-.365,-.042],[.93,.66,1.61]),V(i,U(.143,.035,.235,.014),f,[0,-.419,-.047]),V(i,U(.116,.028,.06,.005),p,[0,-.269,-.062]);for(let e=0;e<4;e++)V(i,Vt([[-.025,-.168-e*.035,-.064],[.025,-.191-e*.035,-.066]],.003,4,1),m);Wt(i),t.add(n,i),this.rig.add(t),this.limbs.push(t),this.knees.push(i)}let k=new z(1,1,14,22),A=k.getAttribute(`position`),M=k.getAttribute(`uv`),N=[];for(let e=0;e<A.count;e++){let t=M.getX(e),n=1-M.getY(e);A.setXYZ(e,(t-.5)*(.365+n*.335),.555-n*1.02,.13+n*.16+Math.cos(t*Math.PI*10)*.015*n);let r=t<.075||t>.925||n>.956,a=new c(r?i.accent:16777215);r&&a.lerp(new c(16777215),.35),N.push(a.r,a.g,a.b)}k.setAttribute(`color`,new T(N,3)),k.computeVertexNormals(),this.cloakBase=new Float32Array(A.array);let P=u.clone();P.color.multiplyScalar(.66),P.side=2,P.vertexColors=!0,this.cloak=V(this.rig,k,P),this.cloak.name=`animated-woven-cloak`,t!==null&&(this.marker=V(this.root,new oe(.071,0),new J({color:t===0?13810813:9550528,emissive:t===0?8413233:3433582,emissiveIntensity:.4,roughness:.36,metalness:.6}),[0,1.42,0]),this.marker.castShadow=!1);let F=new Set;this.root.traverse(e=>{if(e instanceof w)for(let t of Array.isArray(e.material)?e.material:[e.material])F.add(t)}),this.materials=[...F]}setOpacity(e){if(e=N.clamp(e,0,1),this.opacity!==e){this.opacity=e;for(let t of this.materials){let n=e<1;t.alphaHash!==n&&(t.alphaHash=n,t.needsUpdate=!0),t.opacity=e}}}animate(e,t,n,r,i){let a=e===`run`,o=e===`airborne`,s=e===`finished`,c=t*Math.max(n,1)*2.55,l=Math.sin(c),u=Math.min(1,n/4.5);if(this.rig.position.y=a?Math.abs(l)*.021*u:Math.sin(t*1.9+this.id)*.004,e!==`stumble`){this.targetEuler.set(e===`dive`?-Math.PI/2:a?-.067:0,r,a?l*.016:0,`YXZ`),this.targetRotation.setFromEuler(this.targetEuler),this.rig.quaternion.slerp(this.targetRotation,1-Math.exp(-Math.max(i,.001)*13));for(let n=0;n<2;n++){let r=n===0?-1:1,i=l*r;this.limbs[n].rotation.set(a?i*.67*u:s?2.48+Math.sin(t*4+n)*.12:o?.55:e===`dive`?2.75:.07,0,r*(o?.3:.105)),this.elbows[n].rotation.x=a?.42+Math.max(0,-i)*.3:s?.18:.16,this.limbs[n+2].rotation.x=a?-i*.66*u:o?n?.28:-.38:e===`dive`?-.12:0,this.knees[n].rotation.x=a?-Math.max(0,i)*.97*u:o?-.65:-.025}}this.head.rotation.y=Math.sin(t*.62+this.id)*(a?.015:.035),this.eyes.scale.y=Math.sin(t*1.15+this.id*.7)>.995?.08:1;let d=this.cloak.geometry.getAttribute(`position`),f=this.cloak.geometry.getAttribute(`uv`);for(let e=0;e<d.count;e++){let n=1-f.getY(e),r=f.getX(e),i=n*n;d.setXYZ(e,this.cloakBase[e*3]+Math.sin(t*2.6+n*3+this.id)*i*.022,this.cloakBase[e*3+1]+(a?.12*u:.01)*i,this.cloakBase[e*3+2]+i*((a?.14*u:.02)+Math.sin(t*(a?7:2.5)-n*5+r*4+this.id)*(a?.045:.018)))}d.needsUpdate=!0,++this.cloakFrame%3==0&&this.cloak.geometry.computeVertexNormals(),this.marker&&(this.marker.position.y=1.42+Math.sin(t*2)*.035,this.marker.rotation.y=t*.45)}},Kt=class extends me{neighbors=[];lane;constructor(e,t){let n=(e.id%3-1)*2.35,r=t.map((e,r)=>{if(r>=t.length-2)return e.clone();let a=r%96,o=a>=42&&a<=52?.24:1,s=t[r+1].clone().sub(e).normalize(),c=new i(0,1,0).cross(s).normalize();return e.clone().addScaledVector(c,n*o)});super(e,r),this.lane=n}decide(t,n){let r=t>=this.nextReaction,i=super.decide(t,n),a=this.actor;if(r&&(this.nextReaction=t+.04+(1-a.skill)*.045),!a.active||a.machine.state===`respawn`)return i;if(!a.grounded){let t=a.world.castRay(new e.Ray(a.current,{x:0,y:-1,z:0}),2.5,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,e=>!(e.collisionGroups()>>>16&1));return{...i,jump:a.doubleJumpEnabled&&a.airJumpAvailable&&a.body.linvel().y<.2&&!t}}let o=Math.hypot(i.x,i.z);if(o<.01)return i;let s=i.x/o,c=i.z/o,l=e=>!(e.collisionGroups()>>>16&1),u=!1;for(let t of[.7,1.15]){let n=a.world.castRay(new e.Ray({x:a.current.x+s*t,y:a.current.y,z:a.current.z+c*t},{x:0,y:-1,z:0}),2.25,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,l);(!n||n.timeOfImpact<.4)&&(u=!0)}let d=a.world.castRay(new e.Ray({x:a.current.x,y:a.current.y-.1,z:a.current.z},{x:s,y:0,z:c}),3.5,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,e=>!!(e.collisionGroups()>>>16&4)),f=.93+a.skill*.07;for(let e of this.neighbors){if(e===a||!e.active||Math.abs(e.current.y-a.current.y)>1.5)continue;let t=e.current.x-a.current.x,n=e.current.z-a.current.z,r=t*s+n*c,i=t*c-n*s;r>.2&&r<2.2&&Math.abs(i)<.85&&!u&&(f*=.82)}return d&&!u&&(f=d.timeOfImpact<1.7?0:.65),i={...i,x:i.x*f,z:i.z*f},{...i,jump:u||!d&&this.stuckTime>.8}}};export{Kt as AincradBrain,dt as AincradCinematic,Rt as AincradPostProcessing,Gt as ElfAppearance,Ke as aincradMeadowHeight,it as createAincradCourse,Qe as createAincradWorld};