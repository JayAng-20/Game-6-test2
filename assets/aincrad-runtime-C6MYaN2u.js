import{a as e,r as t}from"./world-CeqXiYg9.js";import{$ as n,A as r,At as i,C as a,Ct as o,D as s,Dt as c,E as l,Et as u,F as d,G as f,H as p,J as m,K as h,L as g,M as _,Mt as v,N as y,Nt as b,O as x,Ot as S,P as C,Pt as w,Q as T,R as E,S as D,St as O,T as k,Tt as A,U as j,V as ee,W as te,X as M,Y as N,Z as P,_ as ne,a as re,at as F,b as I,bt as L,ct as R,d as ie,dt as z,et as B,f as V,ft as H,g as U,gt as ae,h as W,ht as oe,i as se,it as ce,j as le,jt as G,k as ue,kt as de,lt as K,mt as fe,nt as pe,ot as me,pt as he,q as ge,rt as q,st as _e,t as ve,tt as ye,ut as be,v as xe,vt as Se,w as Ce,wt as we,x as Te,xt as Ee,y as De,yt as J,z as Oe}from"./ai-DE6zaXky.js";import{c as Y,i as X,l as ke,o as Ae,r as Z,t as je,u as Me}from"./floating-world-35u4uscX.js";var Ne=class e extends n{constructor(){let t=e.SkyShader,n=new J({name:t.name,uniforms:S.clone(t.uniforms),vertexShader:t.vertexShader,fragmentShader:t.fragmentShader,side:1,depthWrite:!1});super(new I(1,1,1),n),this.isSky=!0}};Ne.SkyShader={name:`SkyShader`,uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new v},up:{value:new v(0,1,0)},cloudScale:{value:2e-4},cloudSpeed:{value:1e-4},cloudCoverage:{value:.4},cloudDensity:{value:.4},cloudElevation:{value:.5},showSunDisc:{value:1},time:{value:0}},vertexShader:`
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

		}`};function Q(e,t){let n=Math.sin(e*127.1+t*311.7)*43758.5453123;return n-Math.floor(n)}function Pe(e,t){let n=Math.floor(e),r=Math.floor(t),i=e-n,a=t-r;return i=i*i*(3-2*i),a=a*a*(3-2*a),P.lerp(P.lerp(Q(n,r),Q(n+1,r),i),P.lerp(Q(n,r+1),Q(n+1,r+1),i),a)}function Fe(e,t){let n=0,r=.5;for(let i=0;i<5;i++)n+=Pe(e,t)*r,e=e*2.03+17.1,t=t*2.03+9.2,r*=.5;return n}function Ie(e,t,n=!1){let r=new le(e,t,t,H);return r.wrapS=r.wrapT=fe,r.magFilter=N,r.minFilter=M,r.generateMipmaps=!0,r.anisotropy=8,n&&(r.colorSpace=ae),r.needsUpdate=!0,r}function Le(e){let t=e===`stone`?1024:512,n=new Uint8Array(t*t*4),r=new Uint8Array(t*t*4),i=new Uint8Array(t*t*4),a=new Float32Array(t*t);for(let r=0;r<t;r++)for(let o=0;o<t;o++){let s=r*t+o,c=s*4,l=Q(o,r),u=(Math.sin(Math.PI*o/t)*Math.sin(Math.PI*r/t))**.5,d=o*256/t,f=r*256/t,p=.5+(Fe(d/23,f/23)-.5)*u,m=.5+(Fe(d/84,f/84)-.5)*u,h=p*.7+l*.08,g=160,_=160,v=148;if(e===`stone`){let e=Math.floor(f/32),t=(d+e%2*32)%64,n=f%32,r=t<.65+l*.3||t>63.35||n<.65+l*.3||n>31.35,i=Q(Math.floor((d+e%2*32)/64),e),a=Math.abs(Math.sin(d*.12+f*.09+p*15))<.024,o=(r?.51:.65+i*.23)*(.79+p*.25+m*.14)+(l-.5)*.08-(a?.08:0);g=o*205,_=o*202,v=o*185,h=(r?.29:.65+i*.12)+p*.2+l*.09}else if(e===`rock`){let e=Fe(d/12,f/12)*u,t=.49+p*.32+e*.08;g=t*131,_=t*143,v=t*142,h=p*.6+e*.27+l*.1}else{let e=.6+p*.5+l*.11;g=e*108,_=e*124,v=e*58,h=p*.65+l*.35}n[c]=g,n[c+1]=_,n[c+2]=v,n[c+3]=255,a[s]=h;let y=e===`stone`?175+m*67:215+m*36;i[c]=i[c+1]=i[c+2]=y,i[c+3]=255}let o=new v;for(let e=0;e<t;e++)for(let n=0;n<t;n++){let i=(r,i)=>a[(e+i+t)%t*t+(n+r+t)%t];o.set((i(-1,0)-i(1,0))*1.7,(i(0,-1)-i(0,1))*1.7,1).normalize();let s=(e*t+n)*4;r[s]=(o.x*.5+.5)*255,r[s+1]=(o.y*.5+.5)*255,r[s+2]=(o.z*.5+.5)*255,r[s+3]=255}return{map:Ie(n,t,!0),normalMap:Ie(r,t),roughnessMap:Ie(i,t)}}function Re(){let e=Le(`stone`),t=Le(`rock`),n=Le(`grass`),r=new Uint8Array(262144);for(let e=0;e<256;e++)for(let t=0;t<256;t++){let n=(e*256+t)*4,i=t/256,a=e/256,o=Math.abs(Math.sin((i+a*.5)*Math.PI*12))<.075||Math.abs(Math.sin((i-a*.5)*Math.PI*12))<.075,c=new s([2116965,6454396,12096594,5464657,4282745][Math.floor(Q(Math.floor(i*12+a*6),Math.floor(i*12-a*6))*5)]),l=o?.08:.8+Q(t,e)*.2;r[n]=Math.sqrt(c.r)*255*l,r[n+1]=Math.sqrt(c.g)*255*l,r[n+2]=Math.sqrt(c.b)*255*l,r[n+3]=255}let i=Ie(r,256,!0),a=new q({...e,color:13223865,roughness:.9,normalScale:new G(.48,.48)}),o=new q({...e,color:13353388,roughness:.79,normalScale:new G(.78,.78)}),c=new q({...e,color:14802377,roughness:.86,normalScale:new G(.28,.28)}),l={stone:a,path:o,limestone:c,rock:new q({...t,color:9213585,roughness:1,normalScale:new G(1.05,1.05)}),grass:new q({...n,color:9083492,roughness:1,normalScale:new G(.3,.3)}),bronze:new q({color:5402473,roughness:.57,metalness:.64}),gold:new q({color:12360541,roughness:.46,metalness:.72}),window:new q({color:13950935,map:i,emissiveMap:i,roughness:.19,metalness:.28,emissive:16764800,emissiveIntensity:.35,side:2}),foliage:new q({color:4808509,roughness:1}),bark:new q({...t,color:7496269,roughness:1})};return a.name=c.name=`Aincrad masonry`,o.name=`Aincrad paving`,{...l,dispose(){for(let e of Object.values(l))e.dispose();for(let r of[e,t,n])for(let e of Object.values(r))e.dispose();i.dispose()}}}function ze(e=0){let t=new Uint8Array(65536),n=(t,n)=>Math.sin((t*4+n*2)*Math.PI*2/128+e)*.55+Math.sin((t*9-n*7)*Math.PI*2/128+e*1.3)*.22+Math.cos((t*17+n*13)*Math.PI*2/128)*.1,r=new v;for(let e=0;e<128;e++)for(let i=0;i<128;i++){r.set((n(i-1,e)-n(i+1,e))*.7,(n(i,e-1)-n(i,e+1))*.7,1).normalize();let a=(e*128+i)*4;t[a]=(r.x*.5+.5)*255,t[a+1]=(r.y*.5+.5)*255,t[a+2]=(r.z*.5+.5)*255,t[a+3]=255}return Ie(t,128)}function Be(){let e=document.createElement(`canvas`);e.width=e.height=256;let t=e.getContext(`2d`);t.lineCap=`round`;let n=(e,n,r,i,a,o)=>{t.beginPath(),t.moveTo(e,n),t.lineTo(r,i),t.strokeStyle=a,t.lineWidth=o,t.stroke()};n(128,250,128,18,`#65583b`,3);for(let e=0;e<20;e++)for(let t of[-1,1]){let r=236-e*10,i=128+t*((1-e/23)*105),a=r-33;n(128,r,i,a,`#465c34`,1.7);for(let o=0;o<24;o++){let s=o/24,c=128+(i-128)*s,l=r+(a-r)*s,u=Q(e,o)>.5?`#577340`:`#8b9a61`;n(c,l,c+t*(6+Q(o,e)*9),l-8-Q(e,o)*12,u,1.4),n(c,l,c+t*9,l+6,u,1.1)}}let r=new a(e);r.colorSpace=ae,r.anisotropy=8;let i=new q({map:r,roughness:1,side:2,alphaTest:.42,color:10728859}),o=[];for(let e=0;e<13;e++)for(let t=0;t<5;t++){let n=.5*(1-e/15),r=.26,i=t/5*Math.PI*2+e*.77,a=new K(n,r,1,2);a.rotateX(-.5),a.translate(0,r/2,n*.22),a.rotateY(i),a.translate(0,.09+e*.059,0),o.push(a)}let s=U(o);return o.forEach(e=>e.dispose()),{geometry:s,material:i,map:r}}var Ve=Math.PI*2,He=e=>484-(e-80)*.55;function Ue(e=!1){let t=(e,t,n,r)=>{e.moveTo(-t,n),e.lineTo(t,n),e.lineTo(t,r*.58),e.quadraticCurveTo(t*.95,r*.82,0,r),e.quadraticCurveTo(-t*.95,r*.82,-t,r*.58),e.closePath()},n=new L;return e?(n.moveTo(-.5,0),n.lineTo(-.5,.58),n.quadraticCurveTo(-.475,.82,0,1),n.quadraticCurveTo(.475,.82,.5,.58),n.lineTo(.5,0),n.lineTo(.365,0),n.lineTo(.365,.51),n.quadraticCurveTo(.347,.72,0,.88),n.quadraticCurveTo(-.347,.72,-.365,.51),n.lineTo(-.365,0),n.closePath()):t(n,.5,0,1),new E(n,{depth:e?.18:.035,bevelEnabled:e,bevelSize:.018,bevelThickness:.018,bevelSegments:1,steps:1,curveSegments:5})}var We=class{root;batches=new Map;constructor(e){this.root=e}add(e,t,n,r,i,a=new z,o=new s(1,1,1)){let c=this.batches.get(e);c||(c={geometry:t,material:n,matrices:[],colors:[]},this.batches.set(e,c)),c.matrices.push(new T().compose(r,a,i)),c.colors.push(o)}finish(){for(let[e,t]of this.batches){let n=t.geometry,r=t.material;if(r instanceof q&&/masonry|paving/.test(r.name)){r=r.clone(),n=n.clone();let e=new Float32Array(t.matrices.length*3);t.matrices.forEach((t,n)=>{let r=t.elements;e[n*3]=Math.hypot(r[0],r[1],r[2]),e[n*3+1]=Math.hypot(r[4],r[5],r[6]),e[n*3+2]=Math.hypot(r[8],r[9],r[10])}),n.setAttribute(`masonrySize`,new h(e,3));let i=/Cylinder|Cone/.test(n.type);r.onBeforeCompile=e=>{e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
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
            #endif`)},r.customProgramCacheKey=()=>`masonry-metres-${i}`}let i=new ge(n,r,t.matrices.length);i.name=e,i.castShadow=!0,i.receiveShadow=!0,t.matrices.forEach((e,n)=>{i.setMatrixAt(n,e),i.setColorAt(n,t.colors[n])}),i.computeBoundingSphere(),this.root.add(i)}}};function Ge(e,t){let i=new p;i.name=`Ten terraced districts and the crown cathedral`,e.add(i);let a=new We(i),o=new I(1,1,1),c=new r(1,1,1,16),l=new ue(1,1,8),u=new ue(1,1,4);u.rotateY(Math.PI/4);let d=Ue(),m=Ue(!0),h=d.getAttribute(`uv`);for(let e=0;e<h.count;e++)h.setX(e,h.getX(e)+.5);let g=t.stone.clone();g.color.set(14537917);let _=t.rock.clone();_.color.set(4545889),_.roughness=.65;let y=t.window.clone();y.emissive.set(16760160),y.emissiveIntensity=.36;let b=(e,t,n)=>new v(e,t,n),x=e=>new z().setFromAxisAngle(b(0,1,0),e),S=(e,t,n,r,i,o=0,c=1)=>a.add(e,t,n,r,i,[`Recessed grand arcade openings`,`Carved gothic archivolts`,`Hundred floors of recessed windows`,`Window surrounds`].includes(e)?x(o).multiply(new z().setFromAxisAngle(b(1,0,0),-Math.atan(.55))):x(o),new s(c,c*.99,c*.96)),C=(e,t,n)=>b(Math.sin(e)*t,n,Math.cos(e)*t),w=(e,t,a,o,s,c)=>{let l=new r(a-.55*o,a,o,192,1,!0),u=l.getAttribute(`uv`);for(let e=0;e<u.count;e++)u.setXY(e,u.getX(e)*a*Ve/4,u.getY(e)*o/4.8);let d=new n(l,c);if(d.position.y=t+o/2,d.castShadow=d.receiveShadow=!0,d.name=e,i.add(d),s){let e=new n(new oe(a-s,a,192),c),r=e.geometry.getAttribute(`position`),l=e.geometry.getAttribute(`uv`);for(let e=0;e<l.count;e++)l.setXY(e,r.getX(e)/4,r.getY(e)/4.8);e.rotation.x=-Math.PI/2,e.position.y=t+o,e.receiveShadow=!0,i.add(e)}};w(`Continuous inner castle mass behind the arcades`,80,455,540,0,g);for(let e=0;e<10;e++){let n=80+e*54,r=He(n);w(`District ${e+1} weathered retaining wall`,n,r-19,43,24,g),w(`Shadowed basal plinth`,n-.4,r+3.5,2.4,10,t.limestone),w(`Broad planted terrace`,n+48,He(n+48)+7,2.8,34,t.limestone);for(let e=1;e<10;e++)w(`Minor masonry cornice`,n+e*5.4,He(n+e*5.4)-18.4,.38,0,e%3==0?t.limestone:g);let i=72-e*3;for(let r=0;r<i;r++){let a=r/i*Ve,s=He(n+4)-5.65,c=.79+Q(r,e+31)*.26;S(`Recessed grand arcade openings`,d,y,C(a,s,n+4),b(8,17,.8),a),S(`Carved gothic archivolts`,m,t.limestone,C(a,s+.5,n+4),b(8.5,18,1.8),a,c),S(`Arcade central mullions`,o,t.limestone,C(a,s+.8,n+11),b(.42,13,.9),a);for(let e of[-2.15,2.15]){let r=C(a,s+.8,n+10).add(b(Math.cos(a)*e,0,-Math.sin(a)*e));S(`Arcade slender mullions`,o,t.limestone,r,b(.24,11,.7),a)}S(`Arcade horizontal tracery`,o,t.limestone,C(a,He(n+12)-4.9,n+12),b(7.5,.35,.65),a);for(let i=5;i<9;i++){let o=n+i*5.4,s=He(o)-18.3;S(`Hundred floors of recessed windows`,d,y,C(a,s,o),b(2.1,3.2,1),a,.6+Q(r+i,e)*.4),S(`Window surrounds`,m,t.limestone,C(a,s+.12,o-.1),b(2.5,3.5,.6),a,c)}let f=a+Math.PI/i;if(S(`Load-bearing tapered piers`,o,g,C(f,He(n+18)-1,n+19),b(1.8,34,6),f,c),S(`Carved capital blocks`,o,t.limestone,C(f,He(n+34),n+34),b(3.2,1.1,6.7),f),r%2==0){let i=n+48,s=7+Q(r,e+2)*7,f=He(i+s)-3;S(`Terrace town houses`,o,g,C(a,f,i+s/2),b(7.2,s,9),a,c),S(`Clustered steep slate roofs`,u,_,C(a,f,i+s+4.5),b(6.4,9,8),a),S(`Townhouse glazed bays`,d,y,C(a,f+4.7,i+2),b(2.3,3.9,1),a),S(`Roof gilded finials`,l,t.gold,C(a,f,i+s+10),b(.24,2.8,.24),a),S(`Terrace cypress trees`,l,t.foliage,C(a+.014,He(i+9)-13,i+7),b(2.3,12,2.3),a)}}for(let r=0;r<12;r++){let i=r/12*Ve+e%2*.12,a=n+15,o=He(n+36)+6;S(`District bastion shafts`,c,g,C(i,o,a),b(7.5,30,7.5),i),S(`Bastion machicolations`,c,t.limestone,C(i,o,n+31),b(8.6,2.4,8.6),i),S(`Bastion slate spires`,l,_,C(i,o,n+40),b(8.8,17,8.8),i),S(`Golden bastion tips`,l,t.gold,C(i,o,n+50),b(.45,5,.45),i);for(let e=-1;e<=1;e++){let t=i+e*.045;S(`Bastion arrow slits`,d,y,C(t,o+7.4,n+18),b(1.3,6,1),t)}}}let T=new r(488,65,177,192,16),E=T.getAttribute(`position`);for(let e=0;e<E.count;e++){let t=E.getX(e),n=E.getY(e),r=E.getZ(e),i=Math.atan2(r,t),a=(Math.sin(i*17+n*.024)*6+Math.sin(i*41-n*.033)*4)*(1-(n+88.5)/177);E.setXYZ(e,t+Math.cos(i)*a,n+Math.sin(i*23)*3,r+Math.sin(i)*a)}T.computeVertexNormals();let D=new n(T,t.rock);D.position.y=-14,D.castShadow=D.receiveShadow=!0,i.add(D);let O=new f(1,1);for(let e=0;e<100;e++){let n=e/100*Ve,r=-25-Q(e,73)*75,i=(65+(r+102)/177*423)*(.85+Q(e,11)*.14);S(`Fractured floating rock strata`,O,t.rock,C(n,i,r),b(25+Q(e,4)*24,22+Q(e,9)*60,22),n)}w(`Grand foundation rim`,74,491,6,28,t.limestone),w(`Summit sanctuary terrace`,616,184,4,183,g);let k=(e,n,r,i,a,s=0)=>{S(`Cathedral limestone walls`,o,g,b(e,620+a/2,n),b(r,a,i),s),S(`Cathedral pitched roofs`,u,_,b(e,620+a+10,n),b(r*.76,24,i*.75),s);for(let c=-1;c<=1;c+=2)for(let u=0;u<6;u++){let f=b(c*(r/2+.15),12,-i/2+6+u*(i-12)/5).applyQuaternion(x(s)).add(b(e,620,n));S(`Cathedral lancet glass`,d,y,f,b(4,18,1),s+c*Math.PI/2),S(`Cathedral tracery`,m,t.limestone,f.clone().add(b(c*.3,0,0).applyQuaternion(x(s))),b(4.8,19,2),s+c*Math.PI/2);let p=b(c*(r/2+5),a*.43,-i/2+u*i/5).applyQuaternion(x(s)).add(b(e,620,n));S(`Cathedral flying buttresses`,o,t.limestone,p,b(2,a*.86,3),s),S(`Buttress pinnacles`,l,t.limestone,p.clone().add(b(0,a*.43+6,0)),b(2.4,12,2.4),s)}};k(0,0,40,142,44),k(0,0,30,119,37,Math.PI/2);for(let e=0;e<13;e++){let n=e/12*Ve,r=e===12,i=r?0:99,a=r?106:38+e%3*15,o=r?18:8;S(`Cathedral bell towers`,c,g,C(n,i,620+a/2),b(o,a,o),n),S(`Tower cornices`,c,t.limestone,C(n,i,620+a),b(o*1.13,3.2,o*1.13),n),S(`Cathedral needle roofs`,l,_,C(n,i,620+a+(r?35:20)),b(o*1.2,r?70:40,o*1.2),n),S(`Cathedral golden finials`,l,t.gold,C(n,i,620+a+(r?76:46)),b(.7,12,.7),n);for(let e=0;e<8;e++){let s=e/8*Ve,c=C(n,i,620+a-18).add(C(s,o+.2,0));S(`Bell tower openings`,d,y,c,b(r?4.5:2.6,13,1),s),S(`Bell tower frames`,m,t.limestone,c,b(r?5.2:3.2,14,1.5),s)}}a.finish()}var Ke=class e extends n{constructor(t,n={}){super(t),this.isReflector=!0,this.type=`Reflector`,this.forceUpdate=!1,this._reflectionCameras=new WeakMap;let r=this,i=n.color===void 0?new s(8355711):new s(n.color),a=n.textureWidth||512,o=n.textureHeight||512,c=n.clipBias||0,l=n.shader||e.ReflectorShader,u=n.multisample===void 0?4:n.multisample,d=new R,f=new v,p=new v,m=new v,h=new T,g=new v(0,0,-1),_=new b,y=new v,x=new v,C=new b,E=new T,D=new w(a,o,{samples:u,type:j}),O=new J({name:l.name===void 0?`unspecified`:l.name,uniforms:S.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});O.uniforms.tDiffuse.value=D.texture,O.uniforms.color.value=i,O.uniforms.textureMatrix.value=E,this.material=O,this.onBeforeRender=function(e,t,n){let i=this.getReflectionCamera(n);if(p.setFromMatrixPosition(r.matrixWorld),m.setFromMatrixPosition(n.matrixWorld),h.extractRotation(r.matrixWorld),f.set(0,0,1),f.applyMatrix4(h),y.subVectors(p,m),y.dot(f)>0&&this.forceUpdate===!1)return;y.reflect(f).negate(),y.add(p),h.extractRotation(n.matrixWorld),g.set(0,0,-1),g.applyMatrix4(h),g.add(m),x.subVectors(p,g),x.reflect(f).negate(),x.add(p),i.position.copy(y),i.up.set(0,1,0),i.up.applyMatrix4(h),i.up.reflect(f),i.lookAt(x),i.far=n.far,i.updateMatrixWorld(),i.projectionMatrix.copy(n.projectionMatrix),E.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),E.multiply(i.projectionMatrix),E.multiply(i.matrixWorldInverse),E.multiply(r.matrixWorld),d.setFromNormalAndCoplanarPoint(f,p),d.applyMatrix4(i.matrixWorldInverse),_.set(d.normal.x,d.normal.y,d.normal.z,d.constant);let a=i.projectionMatrix;i.isOrthographicCamera?(C.x=(Math.sign(_.x)+a.elements[8])/a.elements[0],C.y=(Math.sign(_.y)+a.elements[9])/a.elements[5],C.z=-n.far,C.w=1):(C.x=(Math.sign(_.x)+a.elements[8])/a.elements[0],C.y=(Math.sign(_.y)+a.elements[9])/a.elements[5],C.z=-1,C.w=(1+a.elements[10])/a.elements[14]),_.multiplyScalar(2/_.dot(C)),a.elements[2]=_.x,a.elements[6]=_.y,i.isOrthographicCamera?(a.elements[10]=_.z-c,a.elements[14]=_.w-1):(a.elements[10]=_.z+1-c,a.elements[14]=_.w),r.visible=!1;let o=e.getRenderTarget(),s=e.xr.enabled,l=e.shadowMap.autoUpdate;e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(D),e.state.buffers.depth.setMask(!0),e.autoClear===!1&&e.clear(),e.render(t,i),e.xr.enabled=s,e.shadowMap.autoUpdate=l,e.setRenderTarget(o);let u=n.viewport;u!==void 0&&e.state.viewport(u),r.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return D},this.dispose=function(){D.dispose(),r.material.dispose()},this.getReflectionCamera=function(e){let t=this._reflectionCameras.get(e);return t===void 0&&(t=e.clone(),this._reflectionCameras.set(e,t)),t}}};Ke.ReflectorShader={name:`ReflectorShader`,uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
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

		}`};function qe(e,t){let n=new K(1,1),r=new Ke(n,{textureWidth:512,textureHeight:512,multisample:0,clipBias:.002,shader:{name:`Rain puddle with scene reflection and capillary ripples`,uniforms:{color:{value:new s(6716795)},tDiffuse:{value:null},textureMatrix:{value:new T},time:{value:0}},vertexShader:`uniform mat4 textureMatrix; varying vec4 projected; varying vec2 wetUv; varying vec3 eye; varying vec3 planeNormal;
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
        }`}});r.name=`Shallow rainwater · live reflected castle and runners`;let i=r.material;i.transparent=!0,i.depthWrite=!1,i.polygonOffset=!0,i.polygonOffsetFactor=-1,r.renderOrder=2,e.add(r);let a=Y.slice(0,-1).flatMap((e,t)=>t%2==0&&![6,22,38,44,46,48,50,70,86].includes(t%96)?[{index:t,p:e.clone().lerp(Y[t+1],.24)}]:[]),o=r.onBeforeRender,c=null,l=!1,u=!0,d=new b,f=new b;return r.onBeforeRender=(...e)=>{if(l||e[2]!==c||e[1].overrideMaterial)return;let n=e[0],i=t.visible,a=n.getScissorTest();n.getViewport(d),n.getScissor(f),l=!0,t.visible=!1;try{n.setScissorTest(!1),o.apply(r,e)}finally{t.visible=i,n.setViewport(d),n.setScissor(f),n.setScissorTest(a),l=!1}},{prepareCamera(e){if(c=e,!u){r.visible=!1;return}let t=a[0],n=1/0;for(let r of a){let i=r.p.distanceToSquared(e.position);i<n&&(n=i,t=r)}if(r.visible=n<3025,!r.visible)return;let i=Y[t.index+1].clone().sub(Y[t.index]).normalize(),o=new v().crossVectors(new v(0,1,0),i).normalize(),s=new v().crossVectors(i,o).normalize();r.quaternion.setFromRotationMatrix(new T().makeBasis(o,i.clone().negate(),s)),r.position.copy(t.p).addScaledVector(s,.043).addScaledVector(o,t.index%4==0?-.85:.85),r.scale.set(4.6,9.5,1),r.updateMatrixWorld()},update(e){i.uniforms.time.value=e},setEnabled(e){u=e,r.visible=e},setQuality(e,t){r.getRenderTarget().setSize(e&&!t?640:320,e&&!t?640:320)},dispose(){r.onBeforeRender=()=>{},r.removeFromParent(),r.dispose(),n.dispose()}}}var Je=class e extends n{constructor(t,n={}){super(t),this.isRefractor=!0,this.type=`Refractor`,this.camera=new _e;let r=this,i=n.color===void 0?new s(8355711):new s(n.color),a=n.textureWidth||512,o=n.textureHeight||512,c=n.clipBias||0,l=n.shader||e.RefractorShader,u=n.multisample===void 0?4:n.multisample,d=this.camera;d.matrixAutoUpdate=!1,d.userData.refractor=!0;let f=new R,p=new T,m=new w(a,o,{samples:u,type:j});this.material=new J({name:l.name===void 0?`unspecified`:l.name,uniforms:S.clone(l.uniforms),vertexShader:l.vertexShader,fragmentShader:l.fragmentShader,transparent:!0}),this.material.uniforms.color.value=i,this.material.uniforms.tDiffuse.value=m.texture,this.material.uniforms.textureMatrix.value=p;let h=(function(){let e=new v,t=new v,n=new T,i=new v,a=new v;return function(o){return e.setFromMatrixPosition(r.matrixWorld),t.setFromMatrixPosition(o.matrixWorld),i.subVectors(e,t),n.extractRotation(r.matrixWorld),a.set(0,0,1),a.applyMatrix4(n),i.dot(a)<0}})(),g=(function(){let e=new v,t=new v,n=new z,i=new v;return function(){r.matrixWorld.decompose(t,n,i),e.set(0,0,1).applyQuaternion(n).normalize(),e.negate(),f.setFromNormalAndCoplanarPoint(e,t)}})(),_=(function(){let e=new R,t=new b,n=new b;return function(r){d.matrixWorld.copy(r.matrixWorld),d.matrixWorldInverse.copy(d.matrixWorld).invert(),d.projectionMatrix.copy(r.projectionMatrix),d.far=r.far,e.copy(f),e.applyMatrix4(d.matrixWorldInverse),t.set(e.normal.x,e.normal.y,e.normal.z,e.constant);let i=d.projectionMatrix;n.x=(Math.sign(t.x)+i.elements[8])/i.elements[0],n.y=(Math.sign(t.y)+i.elements[9])/i.elements[5],n.z=-1,n.w=(1+i.elements[10])/i.elements[14],t.multiplyScalar(2/t.dot(n)),i.elements[2]=t.x,i.elements[6]=t.y,i.elements[10]=t.z+1-c,i.elements[14]=t.w}})();function y(e){p.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),p.multiply(e.projectionMatrix),p.multiply(e.matrixWorldInverse),p.multiply(r.matrixWorld)}function x(e,t,n){r.visible=!1;let i=e.getRenderTarget(),a=e.xr.enabled,o=e.shadowMap.autoUpdate;e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(m),e.autoClear===!1&&e.clear(),e.render(t,d),e.xr.enabled=a,e.shadowMap.autoUpdate=o,e.setRenderTarget(i);let s=n.viewport;s!==void 0&&e.state.viewport(s),r.visible=!0}this.onBeforeRender=function(e,t,n){n.userData.refractor!==!0&&h(n)&&(g(),y(n),_(n),x(e,t,n))},this.getRenderTarget=function(){return m},this.dispose=function(){m.dispose(),r.material.dispose()}}};Je.RefractorShader={name:`RefractorShader`,uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`

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

		}`};function Ye(e){let t=new K(3100,2850),r=new Ke(t,{textureWidth:512,textureHeight:512,clipBias:.002,multisample:0}),i=new Je(t,{textureWidth:512,textureHeight:512,clipBias:.002,multisample:0}),a=[ze(),ze(2.7)],o=new T,c={...S.clone(De.fog),reflectionMap:{value:r.getRenderTarget().texture},refractionMap:{value:i.getRenderTarget().texture},normalA:{value:a[0]},normalB:{value:a[1]},textureMatrix:{value:o},time:{value:0},tint:{value:new s(7050900)}},l=new J({name:`AincradLakeReflectionRefraction`,uniforms:c,fog:!0,vertexShader:`
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
      }`}),u=new n(t,l);u.name=`Aincrad alpine lake · reflected and refracted`,u.rotation.x=-Math.PI/2,u.position.set(0,-205,470),u.renderOrder=1,e.add(u),r.matrixAutoUpdate=i.matrixAutoUpdate=!1;let d=!0,f=!1,p=new b,m=new b;return u.onBeforeRender=(...e)=>{if(!d||f||e[1].overrideMaterial)return;let[n,a,s]=e;if(s.position.y<u.position.y)return;f=!0,n.getViewport(p),n.getScissor(m);let c=n.getScissorTest(),l=n.getRenderTarget(),h=u.visible;try{o.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),o.multiply(s.projectionMatrix).multiply(s.matrixWorldInverse).multiply(u.matrixWorld),u.visible=!1,r.matrixWorld.copy(u.matrixWorld),i.matrixWorld.copy(u.matrixWorld),n.setScissorTest(!1),r.onBeforeRender(n,a,s,t,r.material,e[5]),i.onBeforeRender(n,a,s,t,i.material,e[5])}finally{u.visible=h,n.setRenderTarget(l),n.setViewport(p),n.setScissor(m),n.setScissorTest(c),f=!1}},{mesh:u,update(e){c.time.value=e},setQuality(e,t){let n=e&&!t?768:384;r.getRenderTarget().setSize(n,n),i.getRenderTarget().setSize(n,n)},setEnabled(e){d=e,u.visible=e},dispose(){u.onBeforeRender=()=>{},e.remove(u),r.dispose(),i.dispose(),a.forEach(e=>e.dispose()),l.dispose(),t.dispose()}}}var Xe=Math.PI*2,Ze=P.clamp,Qe=Array.from({length:19},(e,t)=>{let n=t/19*Xe,r=2750+Q(t,21)*1450;return{x:Math.cos(n)*r,z:Math.sin(n)*r,height:520+Q(t,74)*1350,width:450+Q(t,28)*530}});function $e(e,t){let n=Fe(e/700+11,t/700+8),r=Fe(e/180-7,t/180+20),i=Math.hypot(e/1330,(t-440)/1310),a=P.smoothstep(i,.67,1.12),o=P.lerp(-86+r*19,-1+n*24+r*7,a);for(let n of Qe){let r=(e-n.x)/n.width,i=(t-n.z)/n.width,a=Math.atan2(i,r),s=Math.hypot(r*.83,i*1.12)*(1+Math.sin(a*5+n.x)*.19+Math.sin(a*11)*.08),c=Math.max(0,1-s/1.7);o+=n.height*c**2.4*(.48+Fe(e/160,t/160)*.98)}return o-180}function et(e,t,n,r,i=!1){let a=new ge(e,t,n);return a.castShadow=i,a.receiveShadow=!0,r.add(a),a}function tt(e,t,n,r,i,a=1,o=1,s=1,c=0,l=0){let u=new T().compose(new v(n,r,i),new z().setFromEuler(new g(0,c,l)),new v(a,o,s));e.setMatrixAt(t,u)}function nt(e,t,n){let r=e.getAttribute(`uv`);for(let e=0;e<r.count;e++)r.setXY(e,r.getX(e)*t,r.getY(e)*n);return e}function rt(){let e=new Uint8Array(65536);for(let t=0;t<128;t++)for(let n=0;n<128;n++){let r=(n/128-.5)*2,i=(t/128-.5)*2,a=Math.max(0,1-r*r-i*i*1.6),o=Fe(n/26,t/26),s=Ze((a*(.4+o)-.14)*1.85,0,1),c=206+Ze(i*29+o*35,0,49),l=(t*128+n)*4;e[l]=c,e[l+1]=Math.min(255,c+4),e[l+2]=Math.min(255,c+8),e[l+3]=s*205}let t=new le(e,128,128,H);return t.colorSpace=ae,t.magFilter=N,t.minFilter=M,t.generateMipmaps=!0,t.needsUpdate=!0,t}function it(){let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`);t.fillStyle=`black`,t.fillRect(0,0,128,128),t.fillStyle=`white`;for(let e=0;e<17;e++){let n=20+Q(e,71)*88,r=n+(Q(e,75)-.5)*49,i=24+Q(e,79)*103;t.beginPath(),t.moveTo(n-2,128),t.quadraticCurveTo(n-3,128-i*.62,r,128-i),t.quadraticCurveTo(n+3,128-i*.56,n+2,128),t.fill()}let n=new a(e);return n.anisotropy=4,n}function at(e,t){let i=new p;i.name=`Aincrad · one hundred floating floors`,e.add(i);let a=new Set,c=new Set,l=Re();for(let t of[...e.children])(t instanceof m||t.name===`Aincrad sun target`)&&e.remove(t);e.background=new s(10995668),e.fog=new ee(10399671,6e-5);let u=new Ne;u.name=`Aincrad atmospheric scattering`,u.scale.setScalar(7e3);let d=new v(-.7,.53,.48).normalize(),h=u.material.uniforms;h.turbidity.value=2.6,h.rayleigh.value=2.1,h.mieCoefficient.value=.003,h.mieDirectionalG.value=.76,h.cloudCoverage.value=.58,h.cloudDensity.value=.55,h.sunPosition.value.copy(d),u.material.fragmentShader=u.material.fragmentShader.replace(`gl_FragColor = vec4( texColor, 1.0 );`,`float skyLuminance = dot(texColor, vec3(0.2126, 0.7152, 0.0722));
     texColor *= 1.02 / (1.0 + skyLuminance);
     gl_FragColor = vec4(texColor, 1.0);`),i.add(u);let g=new Se,_=u.clone();_.material=u.material.clone(),g.add(_);let y=new xe(t),b=y.fromScene(g,.015,.1,1e4);y.dispose(),_.material.dispose(),e.environment=b.texture,e.environmentIntensity=.4;let x=new te(13230833,6772544,.48);i.add(x);let S=new C(16768432,3.55);S.name=`Aincrad near-camera sunlight`,S.castShadow=!0,S.shadow.mapSize.set(2048,2048),Object.assign(S.shadow.camera,{left:-56,right:56,top:56,bottom:-56,near:.5,far:520}),S.shadow.bias=-15e-6,S.shadow.normalBias=.018,S.shadow.radius=1.3,i.add(S),i.add(S.target);let w=new C(11916519,.16);w.position.set(400,170,700),i.add(w),Ge(i,l);let T=new K(9800,9800,280,280);T.rotateX(-Math.PI/2);let E=T.getAttribute(`position`),D=new Float32Array(E.count*3),k=new s(7570782),A=new s(9606803),j=new s(13951712),M=new s;for(let e=0;e<E.count;e++){let t=E.getX(e),n=E.getZ(e),r=$e(t,n),i=Math.min(t-640,1460-t,n-1140,1780-n);E.setY(e,r-25*P.smoothstep(i,0,45));let a=Math.hypot($e(t+18,n)-r,$e(t,n+18)-r)/18;M.copy(k).lerp(A,Ze(a*.75+(r-210)/850,0,1)),M.lerp(j,P.smoothstep(r+Fe(t/130,n/130)*130,510,790)*Ze(1.3-a*.42,0,1)),M.multiplyScalar(.83+Fe(t/120,n/120)*.3),D[e*3]=M.r,D[e*3+1]=M.g,D[e*3+2]=M.b}T.setAttribute(`color`,new Te(D,3)),T.computeVertexNormals(),nt(T,580,580);let N=l.rock.clone();N.color.set(16777215),N.map=null,N.vertexColors=!0,N.normalScale.set(.3,.3),N.onBeforeCompile=e=>{e.vertexShader=`varying vec3 alpineWorld;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
 alpineWorld = (modelMatrix * vec4(transformed,1.0)).xyz;`),e.fragmentShader=`varying vec3 alpineWorld;
      float alpineHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float alpineNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(alpineHash(i),alpineHash(i+vec3(1,0,0)),f.x),mix(alpineHash(i+vec3(0,1,0)),alpineHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(alpineHash(i+vec3(0,0,1)),alpineHash(i+vec3(1,0,1)),f.x),mix(alpineHash(i+vec3(0,1,1)),alpineHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      `+e.fragmentShader,e.fragmentShader=e.fragmentShader.replace(`#include <color_fragment>`,`#include <color_fragment>
      float strata=alpineNoise(alpineWorld*vec3(.09,.16,.09))*.45+alpineNoise(alpineWorld*.033)*.35+alpineNoise(alpineWorld*.42)*.2;
      diffuseColor.rgb *= .66+strata*.49;`),e.fragmentShader=e.fragmentShader.replace(`#include <opaque_fragment>`,`float alpineHaze = smoothstep(950.,5200.,distance(cameraPosition,alpineWorld))*.53*(.45+.55*smoothstep(-50.,400.,alpineWorld.y));
      outgoingLight=mix(outgoingLight,vec3(.38,.52,.62),alpineHaze);
      #include <opaque_fragment>`)},N.customProgramCacheKey=()=>`alpine-strata-aerial-perspective-v2`,c.add(N);let re=new n(T,N);re.name=`Alpine grasslands, rocky ridges and snow`,re.receiveShadow=!0,i.add(re);let F=new K(820,640,75,65);F.rotateX(-Math.PI/2),F.translate(1050,0,1460);let I=F.getAttribute(`position`);for(let e=0;e<I.count;e++)I.setY(e,$e(I.getX(e),I.getZ(e))+.15);F.computeVertexNormals(),nt(F,120,92);let L=new n(F,l.grass);L.receiveShadow=!0,i.add(L);let R=new K(1.25,1.1,1,3);R.translate(0,.55,0);let ie={value:0},z=new q({color:6848329,roughness:1,side:2,alphaTest:.46}),B=it();a.add(B),z.alphaMap=B,c.add(z),z.onBeforeCompile=e=>{e.uniforms.aincradWindTime=ie,e.vertexShader=`uniform float aincradWindTime;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
      vec3 bladeWorld = (instanceMatrix * vec4(position, 1.0)).xyz;
      transformed.x += sin(aincradWindTime * 1.35 + bladeWorld.x * 0.035 + bladeWorld.z * 0.06) * position.y * position.y * 0.23;
      transformed.z += cos(aincradWindTime * 0.85 + bladeWorld.z * 0.05) * position.y * 0.09;`)},z.customProgramCacheKey=()=>`aincrad-grass-wind-v1`;let V=et(R,z,65e3,i);V.name=`Wind-swept foreground grasses`;for(let e=0;e<V.count;e++){let t=920+Q(e,12)*310,n=1280+Q(e,15)*320,r=.35+Q(e,34)*.6;tt(V,e,t,$e(t,n)+.16,n,r,r,r,Q(e,32)*Xe),V.setColorAt(e,new s().setHSL(.18+Q(e,54)*.03,.22,.48+Q(e,64)*.2))}let H=ne(new f(1,3)),U=H.getAttribute(`position`);for(let e=0;e<U.count;e++){let t=.89+Math.sin(U.getX(e)*5+U.getY(e)*3)*Math.cos(U.getZ(e)*4)*.12;U.setXYZ(e,U.getX(e)*t,U.getY(e)*t,U.getZ(e)*t)}H.computeVertexNormals();let ae=et(H,l.rock,85,i,!0),W=et(new r(.15,.3,1,6),l.bark,1500,i,!0),oe=Be();c.add(oe.material),a.add(oe.map);let se=et(oe.geometry,oe.material,1500,i,!0);for(let e=0;e<1500;e++){let t=Math.floor(e/75),n=Q(t,57)*Xe+(Q(e,58)-.5)*.32,r=1620+Q(t,59)*700+(Q(e,61)-.5)*420,i=Math.sin(n)*r,a=Math.cos(n)*r,o=$e(i,a),s=i>850&&i<1320&&a>1200&&a<1660?.001:10+Q(e,62)*18;tt(W,e,i,o+s*.22,a,s*.08,s*.44,s*.08),tt(se,e,i,o,a,s,s,s,n)}for(let e=0;e<ae.count;e++){let t=680+Q(e,91)*880,n=1100+Q(e,85)*720,r=.45+Q(e,88)*5;tt(ae,e,t,$e(t,n)+r*.36,n,r*1.4,r*.75,r,Q(e,39)*Xe)}let ce=rt();a.add(ce);let le=new o({map:ce,transparent:!0,opacity:.33,depthWrite:!1,fog:!0,color:15921381});c.add(le);let G=[];for(let e=0;e<42;e++){let t=e/42*Xe,n=e>=22,r=n?1100+Q(e,10)*1350:540+Q(e,51)*310,a=new O(le);a.position.set(Math.cos(t)*r,n?160+Q(e,47)*280:-70+Q(e,46)*110,Math.sin(t)*r);let o=n?620+Q(e,76)*500:240+Q(e,77)*200;a.scale.set(o,o*.38,1),i.add(a),G.push({sprite:a,origin:a.position.clone(),phase:t})}let ue=Ye(e),de=qe(e,ue.mesh),fe=!1,pe=new v,me=d.clone().multiplyScalar(175),he=!0,_e=!1;return{sun:S,materials:l,trackMaterial:l.path,update(e,t){ie.value=e,ue.update(e),de.update(e);for(let{sprite:t,origin:n,phase:r}of G)t.position.x=n.x+Math.sin(e*.013+r)*12,t.position.y=n.y+Math.sin(e*.025+r*2)*3},prepareCamera(e){de.prepareCamera(e),e.getWorldPosition(pe);let t=e.name===`Aincrad cinematic camera`,n=t&&pe.y>640,r=t||Math.hypot(pe.x,pe.z)>760,i=r?1-P.smoothstep(pe.y,-30,160):0;r?(S.target.position.set(0,n?690:295,0).lerp(pe,i),S.position.copy(S.target.position).addScaledVector(d,1650)):(S.position.copy(pe).add(me),S.target.position.copy(pe));let a=r?P.lerp(n?240:680,65,i):34,o=S.shadow.camera;o.left=o.bottom=-a,o.right=o.top=a,o.far=r?3e3:360,S.shadow.bias=r?-45e-6:-15e-6,o.updateProjectionMatrix(),S.target.updateMatrixWorld(),S.updateMatrixWorld()},setQuality(e,t){he=e,ue.setQuality(e,t),de.setQuality(e,t),V.visible=e&&!_e,S.shadow.mapSize.set(e?2048:1024,e?2048:1024),S.shadow.map&&(S.shadow.map.dispose(),S.shadow.map=null)},setFloatingParkMode(e){_e=e,V.visible=he&&!e,ae.visible=W.visible=se.visible=!e},setWaterEnabled(e){ue.setEnabled(e),de.setEnabled(e)},dispose(){if(fe)return;fe=!0,de.dispose(),ue.dispose(),b.dispose(),e.environment=null;let t=new Set;i.traverse(e=>{if(e instanceof n){t.add(e.geometry),e instanceof ge&&e.dispose();for(let t of Array.isArray(e.material)?e.material:[e.material])c.add(t)}}),S.shadow.dispose(),t.forEach(e=>e.dispose()),c.forEach(e=>e.dispose()),a.forEach(e=>e.dispose()),l.dispose(),i.removeFromParent(),i.clear()}}}var ot=class extends se{segment;variant;phase=`warning`;heading;frame;warning;wasRolling=!1;cycle=-1;localTime=0;constructor(t,r,i,a,o,s=o){let c=Y[i].clone().lerp(Y[i+1],.55),d=new f(1.05,2),p=d.getAttribute(`position`);for(let e=0;e<p.count;e++){let t=p.getX(e),n=p.getY(e),r=p.getZ(e),i=1+Math.sin(t*9+r*7)*Math.cos(n*8)*.025;p.setXYZ(e,t*i,n*i,r*i)}d.computeVertexNormals(),super(t,r,{kind:`roller`,p:c.toArray(),size:[2.1,2.1,2.1],surface:`stone`},!0,!1,d,e.ColliderDesc.ball(1.05)),this.segment=i,this.variant=a,this.visual.material.dispose(),this.visual.material=s,this.visual.name=`Crossing boulder`,this.visual.castShadow=this.visual.receiveShadow=!0;let m=Y[i+1].clone().sub(Y[i]).normalize();this.heading=new v(0,1,0).cross(m).normalize();let h=m.clone().cross(this.heading).normalize();this.frame=new z().setFromRotationMatrix(new T().makeBasis(this.heading,h,m)),this.warning=new n(new K(9.4,.6),new B({color:16759892,transparent:!0,opacity:.48,depthWrite:!1})),this.warning.rotation.x=-Math.PI/2,this.warning.quaternion.premultiply(this.frame),this.warning.position.copy(c).addScaledVector(h,.055),r.add(this.warning),this.collider.setEnabled(!1);for(let e of[-1,1]){let t=new n(new I(1.6,2.6,3.2),o);t.quaternion.copy(this.frame),t.position.copy(c).add(new v(e*6.3,1.3,0).applyQuaternion(this.frame)),t.castShadow=t.receiveShadow=!0,r.add(t);let i=new n(new I(1.8,.28,3.6),new q({color:10060891,metalness:.55,roughness:.55}));i.quaternion.copy(this.frame),i.position.copy(t.position).addScaledVector(h,1.4),r.add(i);let a=this.frame.clone().multiply(new z().setFromAxisAngle(new v(0,1,0),-e*Math.PI/2)),s=new v(e*5.47,1.15,0).applyQuaternion(this.frame).add(c),d=new n(new l(1.11,32),new B({color:1515556}));d.quaternion.copy(a),d.position.copy(s),r.add(d);let f=new n(new u(1.2,.16,8,32),o);f.quaternion.copy(a),f.position.copy(s).addScaledVector(this.heading,-e*.045),f.castShadow=!0,r.add(f)}}update(e,t,n){let r=12+this.variant%3,i=(e+this.variant*2.3)%r,a=Math.floor((e+this.variant*2.3)/r),o=i>=1.65&&i<5.7;this.phase=i<1.65?`warning`:o?`rolling`:`rest`,this.localTime=i,this.warning.visible=i<5.7,this.warning.material.opacity=o?.16:.26+Math.sin(i*12)*.16,this.visual.visible=o||i<1.65;let s=(this.variant+a)%2==0?1:-1,c=P.clamp((i-1.65)/4.05,0,1),l=new v(s*(6.7-13.4*c),1.1,0).applyQuaternion(this.frame).add(this.origin);(!o||!this.wasRolling||a!==this.cycle)&&(this.body.setTranslation(l,!0),this.previous.copy(l),this.velocity.set(0,0,0)),this.collider.setEnabled(o),o&&this.move(l,t),this.wasRolling=o,this.cycle=a}sync(){super.sync(),this.visual.quaternion.copy(this.frame).multiply(new z().setFromAxisAngle(new v(0,0,1),this.localTime*3))}impact(e){if(this.phase===`rolling`){for(let t of e)if(t.active&&t.machine.invincible<=0&&this.contact(t)){t.impact=8.5;let e=t.current.clone().sub(this.visual.position).setY(.5).normalize().multiplyScalar(3.2);t.body.applyImpulse(e,!0)}}}},st=class extends se{segment;variant;phase=`warning`;heading;frame;warning;localTime=0;constructor(e,t,r,i,a){let o=Y[r].clone().lerp(Y[r+1],.5);super(e,t,{kind:`pusher`,p:o.toArray(),size:[5.6,1.15,.9],color:10978897,surface:`stone`},!0),this.segment=r,this.variant=i,this.visual.material.dispose(),this.visual.material=a,this.visual.name=`Aincrad brass deck sweeper`;let s=Y[r+1].clone().sub(Y[r]).normalize();this.heading=new v(0,1,0).cross(s).normalize();let c=s.clone().cross(this.heading).normalize();this.frame=new z().setFromRotationMatrix(new T().makeBasis(this.heading,c,s)),this.body.setRotation(this.frame,!0),this.visual.quaternion.copy(this.frame),this.warning=new n(new K(9.2,.45),new B({color:16766061,transparent:!0,opacity:.38,depthWrite:!1})),this.warning.rotation.x=-Math.PI/2,this.warning.quaternion.premultiply(this.frame),this.warning.position.copy(o).addScaledVector(c,.06),t.add(this.warning),this.collider.setEnabled(!1)}update(e,t,n){let r=10.5+this.variant%3*.7,i=(e+this.variant*1.8)%r;this.localTime=i,this.phase=i<1.35?`warning`:i<4.85?`active`:`rest`;let a=this.phase===`active`;this.warning.visible=i<4.85,this.warning.material.opacity=a?.13:.28+Math.sin(i*10)*.12;let o=P.clamp((i-1.35)/3.5,0,1),s=Math.sin(o*Math.PI)*6.4-3.2,c=this.origin.clone().addScaledVector(this.heading,s);a?this.move(c,t):(this.body.setTranslation(this.origin,!0),this.previous.copy(this.origin),this.velocity.set(0,0,0)),this.collider.setEnabled(a),this.visual.visible=i<4.85}sync(){super.sync(),this.visual.quaternion.copy(this.frame).multiply(new z().setFromAxisAngle(new v(0,0,1),this.localTime*1.8))}};function ct(e,t,n,r){let i=n.clone();i.color.set(8420716),i.roughness=.91,i.normalScale.set(.9,.9);let a=r.clone();a.color.set(9143670),a.roughness=.96,a.normalScale.set(1.2,1.2);let o=Array.from({length:36},(n,r)=>{let o=[3,15,29,47,67,83];return new ot(e,t,Math.floor(r/o.length)*96+o[r%o.length],r,i,a)}),s=Array.from({length:12},(n,r)=>{let a=[41,69];return new st(e,t,Math.floor(r/a.length)*96+a[r%a.length],r,i)});return[...o,...s]}function lt(e,t){let n=new We(e),r=new I(1,1,1),i=Ue(!0),a=t.clone();a.color.set(13024162),a.roughness=.87;let o=new q({color:8547653,metalness:.72,roughness:.4}),s=new q({color:3626580,metalness:.58,roughness:.62}),c=new q({color:3296860,side:2,roughness:1}),u=new K(1.2,3.5,6,14),d=u.getAttribute(`position`);for(let e=0;e<d.count;e++){let t=d.getY(e);d.setZ(e,Math.sin(t*3+d.getX(e)*3)*.12*(1.75-t)/3.5)}u.computeVertexNormals();let f=new Ee(1,12,8),p=new pe({color:5002575,roughness:.17,metalness:.12,clearcoat:1,clearcoatRoughness:.1,transparent:!0,opacity:.28,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-1}),m=new l(1,24),h=m.getAttribute(`position`);for(let e=1;e<h.count;e++){let t=1+Math.sin(e*2.8)*.1;h.setXY(e,h.getX(e)*t,h.getY(e)*t)}let g=(e,t,n)=>new v(e,t,n);for(let e=0;e<Y.length-1;e++){let t=Y[e],l=Y[e+1].clone().sub(t).normalize(),d=g(0,1,0).cross(l).normalize(),h=l.clone().cross(d).normalize(),_=new z().setFromRotationMatrix(new T().makeBasis(d,h,l)),v=e=>e.applyQuaternion(_).add(t),y=(e,t,r,i,a,o=_)=>n.add(e,t,r,v(i),a,o),b=e%96>=44&&e%96<=50;if(e%2==0)for(let e of[-1,1]){y(`Bridge corbels`,r,a,g(e*4.5,-2.6,0),g(.9,4.4,1.4));let t=_.clone().multiply(new z().setFromAxisAngle(g(0,0,1),.9));y(`Stone cantilever braces`,r,a,g(16,-10.5,e*1.5),g(1.5,31,1.8),t),y(`Bracket ornamental bosses`,f,o,g(e*4.5,-1.3,-.76),g(.23,.23,.15))}if(!b&&e%4==0){for(let e of[-1,1])y(`Gothic gateway piers`,r,a,g(e*5.85,3.3,0),g(1.35,6.6,1.6)),y(`Gateway stepped bases`,r,a,g(e*5.85,.3,0),g(1.9,.6,2.2)),y(`Gateway capitals`,r,a,g(e*5.85,6.2,0),g(1.9,.4,2.2)),y(`Route ceremonial banners`,u,c,g(e*6.05,3.8,1.03),g(1,1,1)),y(`Banner gilded arms`,r,o,g(e*6.05,5.6,1.05),g(1.6,.085,.12));y(`Open gothic bridge archways`,i,a,g(0,0,-.45),g(13.2,10.7,5)),y(`Arch bronze outer relief`,i,s,g(0,.12,.55),g(13.3,10.8,.65)),y(`Arch keystone medallions`,f,o,g(0,10.05,1.15),g(.48,.7,.15))}if(!b&&![7,23,39,71,87].includes(e%96)){let t=_.clone().multiply(new z().setFromAxisAngle(g(1,0,0),-Math.PI/2));y(`Scattered wet flagstone patches`,m,p,g(e%2?2:-1,.028,8),g(1.1,2.2,1),t)}if([7,23,39,71,87].includes(e%96)){let n=t.distanceTo(Y[e+1]);for(let e of[-2.1,2.1])for(let t of[-1,1])y(`Broken bridge warning inlays`,r,o,g(t*3.5,.06,n/2+e),g(1.2,.04,.22))}}n.finish()}function ut(e){if(e.userData.aincradMetricUV)return;e.userData.aincradMetricUV=!0;let t=e.onBeforeCompile,n=e.customProgramCacheKey.bind(e)();e.onBeforeCompile=(n,r)=>{t.call(e,n,r),n.vertexShader=n.vertexShader.replace(`#include <common>`,`#include <common>
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
      #endif`)},e.customProgramCacheKey=()=>`${n}|aincrad-metric-stone-v1`,e.needsUpdate=!0}function dt(e){let t=``;for(let[n,r]of[[100,`C`],[90,`XC`],[50,`L`],[40,`XL`],[10,`X`],[9,`IX`],[5,`V`],[4,`IV`],[1,`I`]])for(;e>=n;)t+=r,e-=n;return t}function ft(i,a,o,c=o){let l=new p;l.name=`Aincrad exterior spiral course`,l.userData.turns=ke.turns,l.userData.routeSegments=Me,a.add(l),lt(l,o);let d=new I(1,1,1);ut(o);let f=new q({color:4743006,metalness:.68,roughness:.52}),m=new q({color:11650237,metalness:.62,roughness:.42}),g=new q({color:16768672,emissive:16757583,emissiveIntensity:1.3,roughness:.28}),_=new Map;for(let[e,t]of[[o,`Instanced stone deck and balustrades`],[f,`Instanced patinated lantern frames`],[m,`Instanced silver route inlays`],[g,`Instanced lantern glass`]])_.set(e,{material:e,name:t,matrices:[],sizes:[],colors:[]});let y=new T,b=new v,x=new v,S=new z,C=new z,w=new z,E=new s(1,1,1),D=(e,t,n,r=w,i=E)=>{let a=_.get(e);x.set(...n),a.matrices.push(y.compose(t,r,x).clone()),a.sizes.push(...n),a.colors.push(i.clone())},O=(e,t,n,r,i,a)=>{b.set(...r).applyQuaternion(n).add(t),C.copy(n),a&&C.multiply(a),D(e,b,i,C)},k=(n,r,a=w)=>i.createCollider(e.ColliderDesc.cuboid(r[0]/2,r[1]/2,r[2]/2).setTranslation(n.x,n.y,n.z).setRotation(a).setFriction(.65).setCollisionGroups(t.terrain)),A=Ae.obstacles.map(e=>{let t=re(i,a,{...e,surface:`stone`});a.remove(t.visual),t.visual.geometry.dispose();for(let e of Array.isArray(t.visual.material)?t.visual.material:[t.visual.material])e.dispose();t.visual.geometry=d,t.visual.material=o,t.visual.scale.copy(t.size),t.visual.name=`Detached static obstacle reference`,S.copy(t.body.rotation());let n=t.size,r=n.y<.9;if(D(o,t.origin,[n.x,n.y,n.z],S,r?new s(.65,.72,.69):E),r||n.x>20)return t;let c=n.x<6,l=Math.max(.2,n.z-.16);for(let e of[-1,1]){let r=e*(n.x/2-.15);O(o,t.origin,S,[r,n.y/2+.095,0],[.3,.19,l]);let i=[.3,c?.19:1.08,l];if(b.set(r,n.y/2+i[1]/2,0).applyQuaternion(S).add(t.origin),k(b,i,S),c)continue;O(o,t.origin,S,[r,n.y/2+1.04,0],[.4,.2,l]);let a=Math.max(2,Math.ceil(l/3.4));for(let e=0;e<a;e++){let i=P.lerp(-l/2+.24,l/2-.24,e/(a-1));O(o,t.origin,S,[r,n.y/2+.53,i],[.21,.88,.21]),O(o,t.origin,S,[r,n.y/2+.2,i],[.38,.19,.38])}}return t}),j=new v(0,1,0),ee=new v,te=new v,M=new v,N=new T,ne={I:[[0,-.35,0,.35]],V:[[-.2,.35,0,-.35],[0,-.35,.2,.35]],X:[[-.2,-.35,.2,.35],[-.2,.35,.2,-.35]],L:[[-.2,.35,-.2,-.35],[-.2,-.35,.2,-.35]],C:[[.2,.35,-.2,.35],[-.2,.35,-.2,-.35],[-.2,-.35,.2,-.35]]};for(let e=0;e<Y.length-1;e+=8){let t=Y[e];ee.subVectors(Y[e+1],t).normalize(),te.crossVectors(j,ee).normalize();let n=ee.clone().cross(te).normalize();S.setFromRotationMatrix(N.makeBasis(te,n,ee));let r=e%ke.segmentsPerTurn,i=r>=44&&r<=50?2.3:ke.width/2;M.set(t.x,0,t.z).normalize();let a=t.clone().addScaledVector(M,i-.24),s=new z().setFromAxisAngle(j,Math.atan2(-M.x,-M.z));D(o,a.clone().add(new v(0,.25,0)),[.72,.5,.72],s),D(f,a.clone().add(new v(0,1.3,0)),[.14,2.1,.14],s),D(f,a.clone().add(new v(0,2.33,0)),[.7,.12,.7],s),D(g,a.clone().add(new v(0,2.72,0)),[.43,.64,.43],s);for(let e of[-.27,.27])for(let t of[-.27,.27])O(f,a,s,[e,2.72,t],[.055,.79,.055]);if(D(f,a.clone().add(new v(0,3.11,0)),[.72,.13,.72],s),k(a.clone().add(new v(0,1.2,0)),[.45,2.4,.45],s),e%16==0){let t=dt(Math.max(1,Math.round(e/Me*100)));O(f,a,s,[0,1.75,.24],[Math.max(.95,t.length*.32+.2),.76,.1]);let n=.65;for(let e=0;e<t.length;e++)for(let[r,i,o,c]of ne[t[e]]){let l=o-r,u=c-i,d=new z().setFromAxisAngle(new v(0,0,1),-Math.atan2(l,u));O(m,a,s,[(e-(t.length-1)/2)*.32+(r+o)*n/2,1.75+(i+c)*n/2,.302],[.035,Math.hypot(l,u)*n,.012],d)}}if(e>0)for(let e of[-1,1]){let n=new z().setFromAxisAngle(j,e*.62);O(m,t,S,[e*.22,.021,1.4],[.085,.018,.85],n)}}for(let e of _.values()){let t=e.material===o?d:d.clone();t.setAttribute(`courseScale`,new h(new Float32Array(e.sizes),3));let n=new ge(t,e.material,e.matrices.length);n.name=e.name,n.castShadow=e.material!==g,n.receiveShadow=!0;for(let t=0;t<e.matrices.length;t++)n.setMatrixAt(t,e.matrices[t]),n.setColorAt(t,e.colors[t]);n.instanceMatrix.needsUpdate=!0,n.instanceColor&&(n.instanceColor.needsUpdate=!0),n.computeBoundingSphere(),l.add(n)}let[L,R,ie]=Ae.finish,B=new p;B.name=`Summit silver and teal crystal altar`,B.position.set(L,R-1,ie),l.add(B);let V=new q({color:8096130,roughness:.93}),H=new n(new r(2.7,2.9,.18,48),V);H.position.y=.09,H.receiveShadow=!0,B.add(H),i.createCollider(e.ColliderDesc.cylinder(.09,2.8).setTranslation(L,R-.91,ie).setCollisionGroups(t.terrain));for(let e of[1.65,2.6]){let t=new n(new u(e,.035,6,64),m);t.rotation.x=Math.PI/2,t.position.y=.2,B.add(t)}let U=new p;U.name=`Aincrad summit crystal victory sensor`,U.position.set(L,R,ie),a.add(U);let ae=new pe({color:9096132,roughness:.13,metalness:.08,clearcoat:1,clearcoatRoughness:.09,emissive:2052430,emissiveIntensity:.22}),W=new n(new F(.7),ae);W.scale.set(.82,1.45,.82),W.castShadow=!0,U.add(W);let oe=new n(new u(1.05,.035,6,64),m);oe.rotation.x=Math.PI/2+.25,U.add(oe);let se=new be(9360583,3,10,2);se.position.y=1,U.add(se);let ce=i.createCollider(e.ColliderDesc.ball(1).setTranslation(...Ae.finish).setSensor(!0).setCollisionGroups(t.trigger));return{obstacles:[...A,...ct(i,a,o,c)],crown:{root:U,collider:ce}}}var pt=Math.PI*2;function mt(e,t){let n=Math.sin(e*12.9898+t*78.233)*43758.5453;return n-Math.floor(n)}function ht(e,t,n,r,i=new z){e.setMatrixAt(t,new T().compose(n,i,r))}function gt(e,t){return e.add(t),t}function _t(e,t,r,i,a,o,s,c,l){let u=ie(a,o,s,768,192);i.add(u);let d=new B({map:u,transparent:!0,depthWrite:!1,toneMapped:!1});r.add(d);let f=new n(new K(...l),d);return t.add(f.geometry),f.position.set(...c),f.name=`Floating world sign · ${a}`,e.add(f),f}function vt(e){return e===`jungle`?8306024:e===`water`?5682884:e===`volcanic`?12808021:e===`mechanical`?12097118:e===`castle`?13218685:11113840}function yt(e,t){return e.add(t),t}function $(e,t,n,r,i,a,o){t.add(n);let s=V(e,n,r,i,a);return o&&s.rotation.set(...o),s}function bt(e,t,n){(e.userData.dynamics??=[]).push({mesh:t,rate:n})}function xt(e,t,n,i,a){let o=new p;o.name=`Floating attraction theme set · ${i.publicName}`,o.position.set(i.entry[0],X,i.entry[2]),e.add(o);let s=yt(n,new q({color:i.color,emissive:i.color,emissiveIntensity:.14,roughness:.46,metalness:.22})),c=new I(4.5,.32,7.5);for(let e of[-1,1]){$(o,t,c,a.stone,[e*11,.18,1.2]);let n=$(o,t,new r(.34,.48,5.2,10),a.stone,[e*11,2.75,.2]),i=$(o,t,new F(.72,1),s,[e*11,5.7,.2],[1,1.25,1]);bt(o,i,e*.28),n.castShadow=i.castShadow=!0}let l=(e,n,r,i)=>$(o,t,e,a.stone,n,r,i),m=(e,n,r,i)=>$(o,t,e,s,n,r,i);switch(i.pattern){case`gate`:for(let e of[-1,1])l(new I(2.4,8,2.4),[e*5.5,4,-1]),m(new u(3.7,.32,10,28,Math.PI),[0,6.9,-1],[1,1,1],[0,0,0]);break;case`waterfall`:{let e=$(o,t,new K(8,13,10,18),a.water,[-10.5,6.5,-1],[1,1,1],[0,0,Math.PI/2]);e.rotation.set(0,Math.PI,0),bt(o,e,.34),$(o,t,new r(5.8,6.3,.28,32),a.water,[-10.5,.3,-1]),m(new u(5.9,.22,8,32),[-10.5,.48,-1]);break}case`boulder`:for(let[e,t,n,r]of[[-11,2.1,-1,2.1],[11,2.8,2,2.7],[-10,1.5,3,1.7]])l(new d(1,1),[e,t,n],[r,r*.86,r],[.14,.4,.22]);break;case`bridge`:for(let e of[-1,1]){l(new r(.36,.5,7,10),[e*11,3.5,-1]);let t=m(new r(.1,.1,13,8),[e*11,5.8,-1],[1,1,1],[Math.PI/2,0,0]);t.rotation.z=Math.PI/2}m(new u(4,.16,8,28),[0,3.6,-1],[1,1,1],[Math.PI/2,0,0]);break;case`temple`:bt(o,m(new r(3.3,3.3,.45,32),[0,5.6,-1],[1,1,1],[Math.PI/2,0,0]),.22);for(let e of[-1,1])l(new r(.7,.95,6,14),[e*5,3,-1]);break;case`vine`:for(let e of[-1,1])bt(o,m(new u(3.6,.22,10,32),[e*8,4.2,-1],[1,1,1],[Math.PI/2,0,0]),e*.32),l(new r(.5,.85,8,10),[e*8,4,-1]);break;case`water`:for(let e of[-1,1])bt(o,$(o,t,new I(8,.18,7),a.water,[e*8,.18,-1]),.18),m(new u(3.2,.18,8,24),[e*8,.38,-1]);break;case`maze`:for(let e of[-1,1])l(new I(4,4.6,1.2),[e*9,2.3,-2]),l(new I(2.5,3.1,1.2),[e*4.5,1.55,2.5]);m(new F(1,1),[0,5.8,-1],[1.6,1.6,1.6]);break;case`volcano`:for(let e of[-1,1]){l(new ue(2.5,6.5,8),[e*8.5,3.25,-1]);let t=m(new r(1.3,1.3,.12,20),[e*8.5,6.55,-1]);t.material=yt(n,new q({color:16742973,emissive:16727074,emissiveIntensity:2.3})),bt(o,t,e*.45)}break;case`statue`:for(let e of[-1,1])l(new I(2.8,6,2.4),[e*8,3,-1]),m(new Ee(1.15,18,12),[e*8,7,-1]),m(new ue(.7,2.3,6),[e*8,8.3,-1],[1,1,1],[0,0,Math.PI]);break;case`mine`:for(let e of[-1,1]){let t=m(new r(.12,.12,14,8),[e*2.2,.55,-1],[1,1,1],[Math.PI/2,0,0]);t.rotation.x=Math.PI/2}l(new I(4.2,1.8,3.4),[0,1.45,-1]),m(new u(1.7,.18,8,24),[0,1.6,-2.75],[1,1,1],[Math.PI/2,0,0]);break;case`tree`:l(new r(1.8,2.8,9,12),[0,4.5,-1]),m(new f(4.8,1),[0,10,-1],[1.2,1.05,1.2]);for(let e of[-1,1])m(new Ee(1.6,16,10),[e*4.2,7.2,-1]);break;case`observatory`:bt(o,m(new u(4.2,.32,10,36),[0,5.7,-1]),.38),l(new r(.85,1.1,8,14),[0,4,-1]),m(new Ee(1.8,24,16),[0,5.7,-1],[1.8,.65,1.8]);break;case`cave`:l(new Ee(5.6,18,12),[0,4.3,-1],[1.25,.92,.78]),bt(o,$(o,t,new r(2.5,2.8,.28,24),a.dark,[0,2.2,-5.35],[1,1,1],[Math.PI/2,0,0]),.16);break;case`canal`:$(o,t,new I(12,.18,7),a.water,[0,.2,-1]);for(let e of[-1,1])l(new I(2,3.8,8),[e*7,1.9,-1]);m(new u(3.2,.2,8,28),[0,.42,-1]);break;case`beast`:l(new I(5,4.5,4),[0,3,-1]),m(new Ee(2.5,20,14),[0,6.3,-1],[1.15,.9,1]);for(let e of[-1,1])m(new ue(.65,3.2,8),[e*2.1,8,-1],[1,1,1],[0,0,e*.28]);break;case`harbor`:l(new I(12,.45,5),[0,.35,-1]);for(let e of[-1,1]){let t=m(new r(.18,.24,10,8),[e*5,5,-1]),n=m(new K(4,5),[e*5,5.1,-1.1]);n.rotation.y=e*.22,bt(o,t,e*.2)}break;case`construction`:for(let e of[-1,1])l(new I(1.2,10,1.2),[e*7,5,-1]);m(new I(17,.9,.9),[0,9.5,-1]),bt(o,m(new r(.16,.16,4,8),[3,7.4,-1]),.42);break;case`finale`:m(new u(5.5,.38,12,40),[0,6.5,-1]),m(new f(1.3,1),[-7,5.5,-1]),m(new f(1.3,1),[7,5.5,-1]);for(let e of[-1,1])bt(o,m(new K(2.2,4.5,2,3),[e*8,5.5,-1]),e*.3);break;case`castle`:l(new I(7,8,5),[0,4,-1]),m(new ue(3.5,7,8),[0,11.5,-1])}return o.userData.attractionId=i.id,o}function St(e,t,n,i,a,o,s){let c=Z[0],l=Z[2],u=new p;u.name=`Central park wayfinding ring`,e.add(u);for(let e=0;e<a.length;e++){let d=a[e],f=e/a.length*pt-Math.PI/2,p=c+Math.cos(f)*102,m=l+Math.sin(f)*102,h=$(u,t,new r(.24,.34,4.8,8),s,[p,X+2.4,m]);h.castShadow=!0;let g=$(u,t,new F(.9,1),o,[p,X+5.25,m]);g.material=yt(n,new q({color:d.color,emissive:d.color,emissiveIntensity:.42,roughness:.34,metalness:.32})),_t(u,t,n,i,d.publicName,`#fff8df`,`#${vt(d.zone).toString(16).padStart(6,`0`)}`,[p,X+8.1,m],[8.5,1.35]).lookAt(c,X+8.1,l)}let d=$(u,t,new r(20,23,.22,48),s,[c,X+.48,l]);d.receiveShadow=!0;for(let e of[0,Math.PI/2,Math.PI,Math.PI*3/2]){let n=$(u,t,new I(1.1,.12,36),o,[c,X+.66,l],[1,1,1],[0,e,0]);n.receiveShadow=!0}return _t(u,t,n,i,`20 座設施總覽 · M 快捷傳送`,`#fff6d8`,`#2d514b`,[c,X+13.2,l-20],[18,2.9]),_t(u,t,n,i,`遠眺浮游城 ↖`,`#fff6d8`,`#705437`,[c-55,X+5.6,l-55],[10,1.8]),u}function Ct(e,t,n){let i=Z[0],a=Z[2],o=new G(-1,-1).normalize(),s=Math.atan2(o.x,o.y),c=new p;c.name=`Floating City distant lookout`,c.position.set(i+o.x*68,X,a+o.y*68),c.rotation.y=s,e.add(c);let l=yt(n,new q({color:13941100,emissive:9198634,emissiveIntensity:.34,roughness:.38,metalness:.66})),d=yt(n,new q({color:9404523,roughness:.92}));$(c,t,new r(18,22,.5,40),d,[0,.42,0]);let f=$(c,t,new u(18,1.1,12,56),l,[0,12,0]);f.castShadow=!0;for(let e of[-1,1])$(c,t,new r(1.15,1.65,12,12),d,[e*17,6,0]);let m=new p;m.name=`Distant Floating City silhouette`,m.position.set(i-780,X+150,a-760),e.add(m);let h=yt(n,new q({color:9282976,emissive:2575440,emissiveIntensity:.72,roughness:.56,metalness:.32,transparent:!0,opacity:.95})),g=yt(n,new B({color:15780728,transparent:!0,opacity:.82,toneMapped:!1})),_=$(m,t,new r(34,42,8,10),h,[0,0,0]);_.castShadow=!1;for(let[e,n,i,a]of[[-22,-13,42,7],[0,-4,64,10],[22,-14,48,8],[-10,18,34,6],[14,17,38,6]])$(m,t,new r(a*.72,a,i,8),h,[e,i/2+3,n]),$(m,t,new ue(a*1.15,i*.26,8),h,[e,i+8,n]),$(m,t,new Ee(1.1,12,8),g,[e,i*.62,n-a*.78]);let v=$(m,t,new u(42,1.1,10,48),g,[0,12,0]);return v.rotation.x=Math.PI/2,c}function wt(){return[{kind:`ground`,p:[Z[0],X-.65,Z[2]],size:[620,1.3,600],color:9412227,surface:`stone`},{kind:`ground`,p:[Z[0],X-.46,Z[2]],size:[260,.28,260],color:11704426,surface:`stone`}]}function Tt(e){let t=new Set,r=new Set,i=new Set;e.traverse(e=>{e instanceof n&&(t.add(e.geometry),(Array.isArray(e.material)?e.material:[e.material]).forEach(e=>{r.add(e);for(let t of[`map`,`normalMap`,`roughnessMap`,`alphaMap`,`emissiveMap`]){let n=e[t];n instanceof we&&i.add(n)}}))}),e.removeFromParent(),i.forEach(e=>e.dispose()),r.forEach(e=>e.dispose()),t.forEach(e=>e.dispose())}function Et(e,t,r,i,a){let o=new p;o.name=`Floating attraction entrance · ${a.publicName}`,o.position.set(...a.entry),e.add(o);let s=new q({color:vt(a.zone),roughness:.46,metalness:.16}),c=new q({color:a.isCastle?10132107:10128240,roughness:.88,metalness:.06}),l=new q({color:2440766,roughness:.42,metalness:.62});r.add(s).add(c).add(l);let d=gt(t,W(1.5,6.2,1.5,.22)),f=gt(t,W(2.05,.5,2.05,.12));for(let e of[-1,1]){V(o,d,c,[e*7,3,0]),V(o,f,s,[e*7,6.18,0]);let r=new n(gt(t,new u(.7,.09,8,22)),s);r.position.set(e*7,4.5,-.78),r.rotation.x=Math.PI/2,o.add(r)}let m=V(o,W(16.4,1.5,1.5,.2),c,[0,6.2,0]);m.castShadow=m.receiveShadow=!0;let h=V(o,new F(.72),s,[0,7.45,0],[1,1.35,1]);t.add(h.geometry);let g=V(o,W(12.5,2.45,.18,.14),l,[0,8.8,.12]);g.rotation.x=-.12,_t(o,t,r,i,a.publicName,`#fff6d8`,`#${vt(a.zone).toString(16).padStart(6,`0`)}`,[0,8.8,.24],[11.5,1.7]);let _=new be(vt(a.zone),a.isCastle?3.2:1.5,a.isCastle?26:15);_.position.set(0,3.2,1.2),o.add(_);let v=gt(t,new K(1.5,2.2,3,4)),y=new q({color:vt(a.zone),roughness:.9,side:2});r.add(y);let b=new n(v,y);return b.position.set(0,6.9,-.04),b.name=`Animated flag · ${a.publicName}`,o.add(b),o.userData.attractionId=a.id,o.userData.flag=b,o}function Dt(e,t,i){let a=new p;a.name=`Floating City · jungle and ancient ruins amusement park`,t.add(a);let o=new Set,c=new Set,l=new Set,d=je,m=wt(),h=d.filter(e=>!e.isCastle),_=m.map(n=>re(e,t,{...n,surface:`stone`})),y=[];for(let t of h){let n=new p;n.name=`Floating attraction route · ${t.publicName}`,a.add(n);let r=t.level.obstacles.map(t=>re(e,n,{...t,surface:`stone`}));_.push(...r),y.push({attraction:t,group:n})}let b=i.limestone.clone();b.color.set(13022343),b.roughness=.82;let x=i.bronze.clone();x.color.set(3165513),x.metalness=.72;let S=i.foliage.clone();S.color.set(5142856),S.roughness=1;let C=i.bark.clone();C.color.set(5982264);let w=i.foliage.clone();w.color.set(4158020),c.add(b).add(x).add(S).add(C).add(w);let T=new n(gt(o,new r(128,140,.35,64)),b);T.position.set(Z[0],X+.18,Z[2]),T.receiveShadow=!0,T.name=`Central exploration plaza`,a.add(T);for(let e of[92,112]){let t=new n(gt(o,new u(e,.42,8,96)),x);t.rotation.x=Math.PI/2,t.position.set(Z[0],X+.46,Z[2]),a.add(t)}_t(a,o,c,l,`浮遊城遊樂園`,`#fff5d5`,`#264c47`,[Z[0],X+9.6,Z[2]-18],[20,3.7]),_t(a,o,c,l,`按 M 開啟設施快捷線 · 走到入口按 E`,`#eaf8e4`,`#3b6e53`,[Z[0],X+7.2,Z[2]-18],[24,2.2]);let E=d.map(e=>Et(a,o,c,l,e));St(a,o,c,l,d,b,x);let D=gt(o,new r(.22,.42,1,7)),O=gt(o,new f(1,1)),k=new ge(D,C,240),A=new ge(O,w,240);k.name=`Instanced jungle trunks`,A.name=`Instanced layered jungle crowns`,k.castShadow=A.castShadow=!0,k.receiveShadow=A.receiveShadow=!0,a.add(k,A);let j=Z[0],ee=Z[2],te=0;for(let e=0;e<240;e++){let t=mt(e,4)*pt,n=185+mt(e,7)*560,r=j+Math.cos(t)*n,i=ee+Math.sin(t)*n;if(h.some(e=>Math.abs(r-e.spawn[0])<12&&i<e.spawn[2]+24&&i>e.level.finish[2]-24)||Math.abs(r-j)<135&&Math.abs(i-ee)<135)continue;let a=9+mt(e,11)*13,o=.75+mt(e,13)*1.05;ht(k,te,new v(r,X+a*.34,i),new v(o,a*.72,o)),ht(A,te,new v(r,X+a*.86,i),new v(a*.26,a*.32,a*.26),new z().setFromEuler(new g(mt(e,17)*.2,mt(e,19)*pt,0))),A.setColorAt(te,new s().setHSL(.26+mt(e,23)*.07,.32+mt(e,29)*.3,.25+mt(e,31)*.22)),te++}k.count=A.count=te,k.instanceMatrix.needsUpdate=A.instanceMatrix.needsUpdate=!0,A.instanceColor&&(A.instanceColor.needsUpdate=!0);let M=gt(o,W(2.3,4.5,2.3,.18)),N=new ge(M,b,96);N.name=`Instanced ancient ruin fragments`,N.castShadow=N.receiveShadow=!0,a.add(N);for(let e=0;e<N.count;e++){let t=e/N.count*pt+mt(e,41)*.18,n=145+mt(e,43)*120,r=1.5+mt(e,47)*5.5;ht(N,e,new v(j+Math.cos(t)*n,X+r/2,ee+Math.sin(t)*n),new v(.7+mt(e,49)*.75,r/4.5,.7+mt(e,53)*.75),new z().setFromEuler(new g(0,mt(e,59)*pt,mt(e,61)*.12)))}N.instanceMatrix.needsUpdate=!0;let P=new p;P.name=`Attraction checkpoint beacon details`,a.add(P);let ne=gt(o,new F(.22,0)),I=new q({color:16769184,emissive:13797943,emissiveIntensity:1.4,roughness:.22,metalness:.35});c.add(I);for(let e of h)e.level.checkpoints.forEach((t,r)=>{let i=new n(ne,I);i.position.set(t[0],t[1]+1.25,t[2]),i.scale.setScalar(r===0?1.25:.82),i.userData.phase=r*.7+e.lengthMeters*.01,i.userData.baseY=i.position.y,P.add(i)});let L=new pe({color:3972772,roughness:.14,metalness:.06,transmission:.08,transparent:!0,opacity:.78,clearcoat:.8,clearcoatRoughness:.12});c.add(L);let R={stone:b,foliage:S,water:L,dark:x,gold:yt(c,i.gold.clone())},ie=d.map(e=>({attraction:e,group:xt(a,o,c,e,R)})),B=ie.map(({group:e})=>e);Ct(a,o,c);let V=[],H=1;for(let[e,t,r,i]of[[1320,1750,24,18],[1960,1180,32,23],[1240,720,28,16]]){let s=new n(gt(o,new K(r,i,8,16)),L);s.position.set(e,X+i/2,t),s.rotation.y=Math.PI,s.name=`Animated jungle waterfall`,a.add(s),V.push(s)}let U=!1,ae=null,oe=(e,t)=>!t||ae===e.id||t.distanceToSquared(new v(...e.entry))<=518400,se=e=>{E.forEach((t,n)=>{t.visible=oe(d[n],e)}),ie.forEach(({attraction:t,group:n})=>{n.visible=oe(t,e)}),y.forEach(({attraction:t,group:n})=>{n.visible=oe(t,e)})};return{obstacles:_,attractions:d,hubSpawn:Z,nearestAttraction:e=>{let t=null,n=1/0;for(let r of d){let i=new v(...r.entry),a=Math.hypot(e.x-i.x,e.z-i.z,(e.y-i.y)*.5);a<n&&a<18&&(n=a,t=r)}return t},getAttraction:e=>d.find(t=>t.id===e)??null,setFocus(e){ae=e===`floating-hub`?null:e,se()},update(e,t,n){se(n),E.forEach((t,n)=>{let r=t.userData.flag;r&&(r.rotation.y=Math.sin(e*1.4+n)*.16,r.rotation.z=Math.sin(e*1.1+n*.7)*.05)}),P.children.forEach((t,n)=>{t.position.y=t.userData.baseY+Math.sin(e*2.4+n*.43)*.12,t.rotation.y=e*.9+n}),B.forEach(e=>{e.userData.dynamics?.forEach(({mesh:e,rate:n})=>{e.rotation.y+=n*t})}),V.forEach((t,n)=>{let r=t.material;r.opacity=.68+Math.sin(e*2.1+n)*.08,t.scale.set(H*(.96+Math.sin(e*2.7+n)*.035),H,H)})},setQuality(e,t){k.castShadow=A.castShadow=N.castShadow=e,B.forEach(t=>{t.traverse(t=>{t instanceof n&&(t.castShadow=e)})});let r=e?t?.92:1:.76;H=r,V.forEach(e=>{e.material=L,e.scale.setScalar(r)})},dispose(){if(!U){U=!0;for(let t of _)e.removeRigidBody(t.body),Tt(t.visual);a.removeFromParent(),o.forEach(e=>e.dispose()),c.forEach(e=>e.dispose()),l.forEach(e=>e.dispose()),a.clear()}}}}var Ot=Math.PI*2,kt=[1160,1530],At=[980,1340],jt=Math.atan2(...At),Mt=1780,Nt=e=>{let t=P.clamp(e,0,1);return t*t*t*(t*(t*6-15)+10)},Pt=class{meadowHeight;duration=76;camera=new _e(50,1,.5,1e4);target=new v;startPoint;elapsed=0;orbitAngle=0;currentShot=`meadow`;currentShotProgress=0;entryCamera=new v;entryTarget=new v;constructor(e=[0,80,512],t=()=>0){this.meadowHeight=t,this.startPoint=e instanceof v?e.clone():new v(...e),this.entryCamera.copy(this.startPoint).add(new v(-8,5,10)),this.entryTarget.copy(this.startPoint).add(new v(0,1,0)),this.camera.name=`Aincrad cinematic camera`,this.update(0,1)}get time(){return this.elapsed}get finished(){return this.elapsed>=this.duration}get frame(){let e={meadow:[`群山之上`,`穿過高山草原，尋找雲海中的浮遊城`],approach:[`浮遊城`,`一百層的天際，懸浮於雲與光之間`],orbit:[`環城巡禮`,`完整環視浮遊城，從基座仰望最高王座`],facade:[`天空聖堂`,`掠過層疊城區，仰望雲端的尖塔與彩窗`],arrival:[`向天空啟程`,`沿城外螺旋古道，一路攀向最頂端`]}[this.currentShot];return{shot:this.currentShot,label:e[0],subtitle:e[1],progress:this.elapsed/this.duration,shotProgress:this.currentShotProgress,time:this.elapsed,finished:this.finished,orbitRadians:this.orbitAngle,orbitDegrees:P.radToDeg(this.orbitAngle),position:this.camera.position.toArray(),target:this.target.toArray()}}update(e,t){this.elapsed=P.clamp(Number.isFinite(e)?e:0,0,this.duration),Number.isFinite(t)&&t>0&&(this.camera.aspect=t);let n=this.elapsed,r=this.camera;if(n<11){this.currentShot=`meadow`,this.currentShotProgress=n/11;let e=Nt(this.currentShotProgress);r.position.set(P.lerp(kt[0],At[0],e),0,P.lerp(kt[1],At[1],e));let t=Nt((n-3.5)/7.5);r.position.y=this.meadowHeight(r.position.x,r.position.z)+3.2+70.8*t,this.target.set(0,P.lerp(100,290,e),0),r.fov=P.lerp(55,48,e),this.orbitAngle=0}else if(n<17){this.currentShot=`approach`,this.currentShotProgress=(n-11)/6;let e=Nt(this.currentShotProgress),t=P.lerp(Math.hypot(...At),Mt,e);r.position.set(Math.sin(jt)*t,P.lerp(this.meadowHeight(...At)+74,360,e),Math.cos(jt)*t),this.target.set(0,P.lerp(290,315,e),0),r.fov=P.lerp(48,52,e),this.orbitAngle=0}else if(n<45){this.currentShot=`orbit`,this.currentShotProgress=(n-17)/28;let e=Nt(this.currentShotProgress),t=Math.sin(Math.PI*e),i=Mt-180*t;this.orbitAngle=Ot*e;let a=jt+this.orbitAngle;r.position.set(Math.sin(a)*i,360+80*e+110*t,Math.cos(a)*i),this.target.set(0,315+38*t,0),r.fov=52-3*t}else if(n<63){this.currentShot=`facade`,this.currentShotProgress=(n-45)/18;let e=Nt(this.currentShotProgress),t=jt-.48*e,i=P.lerp(Mt,410,e);r.position.set(Math.sin(t)*i,440+295*e,Math.cos(t)*i),this.target.set(0,P.lerp(315,700,e),0),r.fov=P.lerp(52,48,e),this.orbitAngle=Ot}else{this.currentShot=`arrival`,this.currentShotProgress=(n-63)/13;let e=Nt(this.currentShotProgress),t=Math.atan2(this.entryCamera.x,this.entryCamera.z),i=Math.atan2(Math.sin(t-(jt-.48)),Math.cos(t-(jt-.48))),a=jt-.48+i*e,o=P.lerp(410,Math.hypot(this.entryCamera.x,this.entryCamera.z),e);r.position.set(Math.sin(a)*o,P.lerp(735,this.entryCamera.y,e),Math.cos(a)*o),this.target.set(0,700,0).lerp(this.entryTarget,Nt(P.smoothstep(e,.15,1))),r.fov=P.lerp(48,55,e),this.orbitAngle=Ot}return r.updateProjectionMatrix(),r.lookAt(this.target),r.updateMatrixWorld(),this.frame}},Ft={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`},It=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},Lt=new me(-1,1,1,-1,0,1),Rt=new class extends D{constructor(){super(),this.setAttribute(`position`,new Oe([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new Oe([0,2,0,0,2,0],2))}},zt=class{constructor(e){this._mesh=new n(Rt,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Lt)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},Bt=class extends It{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof J?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=S.clone(e.uniforms),this.material=new J({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new zt(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},Vt=class extends It{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},Ht=class extends It{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},Ut=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new G);this._width=n.width,this._height=n.height,t=new w(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:j}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Bt(Ft),this.copyPass.material.blending=0,this.timer=new A}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}Vt!==void 0&&(r instanceof Vt?n=!0:r instanceof Ht&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new G);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},Wt=class extends It{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new s}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},Gt={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new s(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`},Kt=class e extends It{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e===void 0?new G(256,256):new G(e.x,e.y),this.clearColor=new s(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new w(i,a,{type:j}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new w(i,a,{type:j});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new w(i,a,{type:j});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),i=Math.round(i/2),a=Math.round(a/2)}let o=Gt;this.highPassUniforms=S.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new J({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let c=[6,10,14,18,22];i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(c[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new G(1/i,1/a),i=Math.round(i/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let l=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=l,this.bloomTintColors=[new v(1,1,1),new v(1,1,1),new v(1,1,1),new v(1,1,1),new v(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=S.clone(Ft.uniforms),this.blendMaterial=new J({uniforms:this.copyUniforms,vertexShader:Ft.vertexShader,fragmentShader:Ft.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new s,this._oldClearAlpha=1,this._basic=new B,this._fsQuad=new zt(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new G(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(t,n,r,i,a){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this._fsQuad.render(t),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(r),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);return new J({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new G(.5,.5)},direction:{value:new G(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

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

				}`})}_getCompositeMaterial(e){return new J({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

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

				}`})}};Kt.BlurDirectionX=new G(1,0),Kt.BlurDirectionY=new G(0,1);var qt={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`},Jt=class extends It{constructor(){super(),this.isOutputPass=!0,this.uniforms=S.clone(qt.uniforms),this.material=new he({name:qt.name,uniforms:this.uniforms,vertexShader:qt.vertexShader,fragmentShader:qt.fragmentShader}),this._fsQuad=new zt(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},x.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},Yt={name:`FXAAShader`,uniforms:{tDiffuse:{value:null},resolution:{value:new G(1/1024,1/512)}},vertexShader:`

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

		}`},Xt=class extends Bt{constructor(){super(Yt)}setSize(e,t){this.material.uniforms.resolution.value.set(1/e,1/t)}},Zt={name:`GTAOShader`,defines:{PERSPECTIVE_CAMERA:1,SAMPLES:16,NORMAL_VECTOR_TYPE:1,DEPTH_SWIZZLING:`x`,SCREEN_SPACE_RADIUS:0,SCREEN_SPACE_RADIUS_SCALE:100,SCENE_CLIP_BOX:0},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new G},cameraNear:{value:null},cameraFar:{value:null},cameraProjectionMatrix:{value:new T},cameraProjectionMatrixInverse:{value:new T},cameraWorldMatrix:{value:new T},radius:{value:.25},distanceExponent:{value:1},thickness:{value:1},distanceFallOff:{value:1},scale:{value:1},sceneBoxMin:{value:new v(-1,-1,-1)},sceneBoxMax:{value:new v(1,1,1)}},vertexShader:`

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
		}`},Qt={name:`GTAODepthShader`,defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`
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

		}`},$t={name:`GTAOBlendShader`,uniforms:{tDiffuse:{value:null},intensity:{value:1}},vertexShader:`
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
		}`};function en(e=5){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),n=tn(t),r=n.length,i=new Uint8Array(r*4);for(let e=0;e<r;++e){let t=n[e],a=2*Math.PI*t/r,o=new v(Math.cos(a),Math.sin(a),0).normalize();i[e*4]=(o.x*.5+.5)*255,i[e*4+1]=(o.y*.5+.5)*255,i[e*4+2]=127,i[e*4+3]=255}let a=new le(i,t,t);return a.wrapS=fe,a.wrapT=fe,a.needsUpdate=!0,a}function tn(e){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),n=t*t,r=Array(n).fill(0),i=Math.floor(t/2),a=t-1;for(let e=1;e<=n;){if(i===-1&&a===t?(a=t-2,i=0):(a===t&&(a=0),i<0&&(i=t-1)),r[i*t+a]!==0){a-=2,i++;continue}r[i*t+a]=e++,a++,i--}return r}var nn={name:`PoissonDenoiseShader`,defines:{SAMPLES:16,SAMPLE_VECTORS:rn(16,2,1),NORMAL_VECTOR_TYPE:1,DEPTH_VALUE_SOURCE:0},uniforms:{tDiffuse:{value:null},tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new G},cameraProjectionMatrixInverse:{value:new T},lumaPhi:{value:5},depthPhi:{value:5},normalPhi:{value:5},radius:{value:4},index:{value:0}},vertexShader:`

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
		}`};function rn(e,t,n){let r=an(e,t,n),i=`vec3[SAMPLES](`;for(let t=0;t<e;t++){let n=r[t];i+=`vec3(${n.x}, ${n.y}, ${n.z})${t<e-1?`,`:`)`}`}return i}function an(e,t,n){let r=[];for(let i=0;i<e;i++){let a=2*Math.PI*t*i/e,o=(i/(e-1))**n;r.push(new v(Math.cos(a),Math.sin(a),o))}return r}var on=class{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(e.random()*256);this.perm=[];for(let e=0;e<512;e++)this.perm[e]=this.p[e&255];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}noise(e,t){let n,r,i,a=.5*(Math.sqrt(3)-1),o=(e+t)*a,s=Math.floor(e+o),c=Math.floor(t+o),l=(3-Math.sqrt(3))/6,u=(s+c)*l,d=s-u,f=c-u,p=e-d,m=t-f,h,g;p>m?(h=1,g=0):(h=0,g=1);let _=p-h+l,v=m-g+l,y=p-1+2*l,b=m-1+2*l,x=s&255,S=c&255,C=this.perm[x+this.perm[S]]%12,w=this.perm[x+h+this.perm[S+g]]%12,T=this.perm[x+1+this.perm[S+1]]%12,E=.5-p*p-m*m;E<0?n=0:(E*=E,n=E*E*this._dot(this.grad3[C],p,m));let D=.5-_*_-v*v;D<0?r=0:(D*=D,r=D*D*this._dot(this.grad3[w],_,v));let O=.5-y*y-b*b;return O<0?i=0:(O*=O,i=O*O*this._dot(this.grad3[T],y,b)),70*(n+r+i)}noise3d(e,t,n){let r,i,a,o,s=(e+t+n)*(1/3),c=Math.floor(e+s),l=Math.floor(t+s),u=Math.floor(n+s),d=1/6,f=(c+l+u)*d,p=c-f,m=l-f,h=u-f,g=e-p,_=t-m,v=n-h,y,b,x,S,C,w;g>=_?_>=v?(y=1,b=0,x=0,S=1,C=1,w=0):g>=v?(y=1,b=0,x=0,S=1,C=0,w=1):(y=0,b=0,x=1,S=1,C=0,w=1):_<v?(y=0,b=0,x=1,S=0,C=1,w=1):g<v?(y=0,b=1,x=0,S=0,C=1,w=1):(y=0,b=1,x=0,S=1,C=1,w=0);let T=g-y+d,E=_-b+d,D=v-x+d,O=g-S+2*d,k=_-C+2*d,A=v-w+2*d,j=g-1+3*d,ee=_-1+3*d,te=v-1+3*d,M=c&255,N=l&255,P=u&255,ne=this.perm[M+this.perm[N+this.perm[P]]]%12,re=this.perm[M+y+this.perm[N+b+this.perm[P+x]]]%12,F=this.perm[M+S+this.perm[N+C+this.perm[P+w]]]%12,I=this.perm[M+1+this.perm[N+1+this.perm[P+1]]]%12,L=.6-g*g-_*_-v*v;L<0?r=0:(L*=L,r=L*L*this._dot3(this.grad3[ne],g,_,v));let R=.6-T*T-E*E-D*D;R<0?i=0:(R*=R,i=R*R*this._dot3(this.grad3[re],T,E,D));let ie=.6-O*O-k*k-A*A;ie<0?a=0:(ie*=ie,a=ie*ie*this._dot3(this.grad3[F],O,k,A));let z=.6-j*j-ee*ee-te*te;return z<0?o=0:(z*=z,o=z*z*this._dot3(this.grad3[I],j,ee,te)),32*(r+i+a+o)}noise4d(e,t,n,r){let i=this.grad4,a=this.simplex,o=this.perm,s=(Math.sqrt(5)-1)/4,c=(5-Math.sqrt(5))/20,l,u,d,f,p,m=(e+t+n+r)*s,h=Math.floor(e+m),g=Math.floor(t+m),_=Math.floor(n+m),v=Math.floor(r+m),y=(h+g+_+v)*c,b=h-y,x=g-y,S=_-y,C=v-y,w=e-b,T=t-x,E=n-S,D=r-C,O=w>T?32:0,k=w>E?16:0,A=T>E?8:0,j=w>D?4:0,ee=T>D?2:0,te=+(E>D),M=O+k+A+j+ee+te,N=+(a[M][0]>=3),P=+(a[M][1]>=3),ne=+(a[M][2]>=3),re=+(a[M][3]>=3),F=+(a[M][0]>=2),I=+(a[M][1]>=2),L=+(a[M][2]>=2),R=+(a[M][3]>=2),ie=+(a[M][0]>=1),z=+(a[M][1]>=1),B=+(a[M][2]>=1),V=+(a[M][3]>=1),H=w-N+c,U=T-P+c,ae=E-ne+c,W=D-re+c,oe=w-F+2*c,se=T-I+2*c,ce=E-L+2*c,le=D-R+2*c,G=w-ie+3*c,ue=T-z+3*c,de=E-B+3*c,K=D-V+3*c,fe=w-1+4*c,pe=T-1+4*c,me=E-1+4*c,he=D-1+4*c,ge=h&255,q=g&255,_e=_&255,ve=v&255,ye=o[ge+o[q+o[_e+o[ve]]]]%32,be=o[ge+N+o[q+P+o[_e+ne+o[ve+re]]]]%32,xe=o[ge+F+o[q+I+o[_e+L+o[ve+R]]]]%32,Se=o[ge+ie+o[q+z+o[_e+B+o[ve+V]]]]%32,Ce=o[ge+1+o[q+1+o[_e+1+o[ve+1]]]]%32,we=.6-w*w-T*T-E*E-D*D;we<0?l=0:(we*=we,l=we*we*this._dot4(i[ye],w,T,E,D));let Te=.6-H*H-U*U-ae*ae-W*W;Te<0?u=0:(Te*=Te,u=Te*Te*this._dot4(i[be],H,U,ae,W));let Ee=.6-oe*oe-se*se-ce*ce-le*le;Ee<0?d=0:(Ee*=Ee,d=Ee*Ee*this._dot4(i[xe],oe,se,ce,le));let De=.6-G*G-ue*ue-de*de-K*K;De<0?f=0:(De*=De,f=De*De*this._dot4(i[Se],G,ue,de,K));let J=.6-fe*fe-pe*pe-me*me-he*he;return J<0?p=0:(J*=J,p=J*J*this._dot4(i[Ce],fe,pe,me,he)),27*(l+u+d+f+p)}_dot(e,t,n){return e[0]*t+e[1]*n}_dot3(e,t,n,r){return e[0]*t+e[1]*n+e[2]*r}_dot4(e,t,n,r,i){return e[0]*t+e[1]*n+e[2]*r+e[3]*i}},sn=class e extends It{constructor(e,t,n=512,r=512,i,a,o){super(),this.width=n,this.height=r,this.clear=!0,this.camera=t,this.scene=e,this.output=0,this._renderGBuffer=!0,this._visibilityCache=[],this.blendIntensity=1,this.pdRings=2,this.pdRadiusExponent=2,this.pdSamples=16,this.gtaoNoiseTexture=en(),this.pdNoiseTexture=this._generateNoise(),this.gtaoRenderTarget=new w(this.width,this.height,{type:j}),this.pdRenderTarget=this.gtaoRenderTarget.clone(),this.gtaoMaterial=new J({defines:Object.assign({},Zt.defines),uniforms:S.clone(Zt.uniforms),vertexShader:Zt.vertexShader,fragmentShader:Zt.fragmentShader,blending:0,depthTest:!1,depthWrite:!1}),this.gtaoMaterial.defines.PERSPECTIVE_CAMERA=+!!this.camera.isPerspectiveCamera,this.gtaoMaterial.uniforms.tNoise.value=this.gtaoNoiseTexture,this.gtaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.normalMaterial=new ye,this.normalMaterial.blending=0,this.pdMaterial=new J({defines:Object.assign({},nn.defines),uniforms:S.clone(nn.uniforms),vertexShader:nn.vertexShader,fragmentShader:nn.fragmentShader,depthTest:!1,depthWrite:!1}),this.pdMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.pdMaterial.uniforms.tNoise.value=this.pdNoiseTexture,this.pdMaterial.uniforms.resolution.value.set(this.width,this.height),this.pdMaterial.uniforms.lumaPhi.value=10,this.pdMaterial.uniforms.depthPhi.value=2,this.pdMaterial.uniforms.normalPhi.value=3,this.pdMaterial.uniforms.radius.value=8,this.depthRenderMaterial=new J({defines:Object.assign({},Qt.defines),uniforms:S.clone(Qt.uniforms),vertexShader:Qt.vertexShader,fragmentShader:Qt.fragmentShader,blending:0}),this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new J({uniforms:S.clone(Ft.uniforms),vertexShader:Ft.vertexShader,fragmentShader:Ft.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:208,blendDst:200,blendEquation:100,blendSrcAlpha:206,blendDstAlpha:200,blendEquationAlpha:100}),this.blendMaterial=new J({uniforms:S.clone($t.uniforms),vertexShader:$t.vertexShader,fragmentShader:$t.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blending:5,blendSrc:208,blendDst:200,blendEquation:100,blendSrcAlpha:206,blendDstAlpha:200,blendEquationAlpha:100}),this._fsQuad=new zt(null),this._originalClearColor=new s,this.setGBuffer(i?i.depthTexture:void 0,i?i.normalTexture:void 0),a!==void 0&&this.updateGtaoMaterial(a),o!==void 0&&this.updatePdMaterial(o)}setSize(e,t){this.width=e,this.height=t,this.gtaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.pdRenderTarget.setSize(e,t),this.gtaoMaterial.uniforms.resolution.value.set(e,t),this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.pdMaterial.uniforms.resolution.value.set(e,t),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse)}dispose(){this.gtaoNoiseTexture.dispose(),this.pdNoiseTexture.dispose(),this.normalRenderTarget.dispose(),this.gtaoRenderTarget.dispose(),this.pdRenderTarget.dispose(),this.normalMaterial.dispose(),this.pdMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this._fsQuad.dispose()}get gtaoMap(){return this.pdRenderTarget.texture}setGBuffer(e,t){e===void 0?(this.depthTexture=new y,this.depthTexture.format=_,this.depthTexture.type=i,this.normalRenderTarget=new w(this.width,this.height,{minFilter:ce,magFilter:ce,type:j,depthTexture:this.depthTexture}),this.normalTexture=this.normalRenderTarget.texture,this._renderGBuffer=!0):(this.depthTexture=e,this.normalTexture=t,this._renderGBuffer=!1);let n=+!!this.normalTexture,r=this.depthTexture===this.normalTexture?`w`:`x`;this.gtaoMaterial.defines.NORMAL_VECTOR_TYPE=n,this.gtaoMaterial.defines.DEPTH_SWIZZLING=r,this.gtaoMaterial.uniforms.tNormal.value=this.normalTexture,this.gtaoMaterial.uniforms.tDepth.value=this.depthTexture,this.pdMaterial.defines.NORMAL_VECTOR_TYPE=n,this.pdMaterial.defines.DEPTH_SWIZZLING=r,this.pdMaterial.uniforms.tNormal.value=this.normalTexture,this.pdMaterial.uniforms.tDepth.value=this.depthTexture,this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture}setSceneClipBox(e){e?(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX!==1,this.gtaoMaterial.defines.SCENE_CLIP_BOX=1,this.gtaoMaterial.uniforms.sceneBoxMin.value.copy(e.min),this.gtaoMaterial.uniforms.sceneBoxMax.value.copy(e.max)):(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX===0,this.gtaoMaterial.defines.SCENE_CLIP_BOX=0)}updateGtaoMaterial(e){e.radius!==void 0&&(this.gtaoMaterial.uniforms.radius.value=e.radius),e.distanceExponent!==void 0&&(this.gtaoMaterial.uniforms.distanceExponent.value=e.distanceExponent),e.thickness!==void 0&&(this.gtaoMaterial.uniforms.thickness.value=e.thickness),e.distanceFallOff!==void 0&&(this.gtaoMaterial.uniforms.distanceFallOff.value=e.distanceFallOff,this.gtaoMaterial.needsUpdate=!0),e.scale!==void 0&&(this.gtaoMaterial.uniforms.scale.value=e.scale),e.samples!==void 0&&e.samples!==this.gtaoMaterial.defines.SAMPLES&&(this.gtaoMaterial.defines.SAMPLES=e.samples,this.gtaoMaterial.needsUpdate=!0),e.screenSpaceRadius!==void 0&&+!!e.screenSpaceRadius!==this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS&&(this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS=+!!e.screenSpaceRadius,this.gtaoMaterial.needsUpdate=!0)}updatePdMaterial(e){let t=!1;e.lumaPhi!==void 0&&(this.pdMaterial.uniforms.lumaPhi.value=e.lumaPhi),e.depthPhi!==void 0&&(this.pdMaterial.uniforms.depthPhi.value=e.depthPhi),e.normalPhi!==void 0&&(this.pdMaterial.uniforms.normalPhi.value=e.normalPhi),e.radius!==void 0&&e.radius!==this.radius&&(this.pdMaterial.uniforms.radius.value=e.radius),e.radiusExponent!==void 0&&e.radiusExponent!==this.pdRadiusExponent&&(this.pdRadiusExponent=e.radiusExponent,t=!0),e.rings!==void 0&&e.rings!==this.pdRings&&(this.pdRings=e.rings,t=!0),e.samples!==void 0&&e.samples!==this.pdSamples&&(this.pdSamples=e.samples,t=!0),t&&(this.pdMaterial.defines.SAMPLES=this.pdSamples,this.pdMaterial.defines.SAMPLE_VECTORS=rn(this.pdSamples,this.pdRings,this.pdRadiusExponent),this.pdMaterial.needsUpdate=!0)}render(t,n,r){switch(this._renderGBuffer&&(this._overrideVisibility(),this._renderOverride(t,this.normalMaterial,this.normalRenderTarget,7829503,1),this._restoreVisibility()),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.gtaoMaterial.uniforms.cameraWorldMatrix.value.copy(this.camera.matrixWorld),this._renderPass(t,this.gtaoMaterial,this.gtaoRenderTarget,16777215,1),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this._renderPass(t,this.pdMaterial,this.pdRenderTarget,16777215,1),this.output){case e.OUTPUT.Off:break;case e.OUTPUT.Diffuse:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.AO:this.copyMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Denoise:this.copyMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Depth:this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this._renderPass(t,this.depthRenderMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n),this.blendMaterial.uniforms.intensity.value=this.blendIntensity,this.blendMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this._renderPass(t,this.blendMaterial,this.renderToScreen?null:n);break;default:console.warn(`THREE.GTAOPass: Unknown output type.`)}}_renderPass(e,t,n,r,i){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,r!=null&&(e.setClearColor(r),e.setClearAlpha(i||0),e.clear()),this._fsQuad.material=t,this._fsQuad.render(e),e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_renderOverride(e,t,n,r,i){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,r=t.clearColor||r,i=t.clearAlpha||i,r!=null&&(e.setClearColor(r),e.setClearAlpha(i||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_overrideVisibility(){let e=this.scene,t=this._visibilityCache;e.traverse(function(e){(e.isPoints||e.isLine||e.isLine2)&&e.visible&&(e.visible=!1,t.push(e))})}_restoreVisibility(){let e=this._visibilityCache;for(let t=0;t<e.length;t++)e[t].visible=!0;e.length=0}_generateNoise(e=64){let t=new on,n=e*e*4,r=new Uint8Array(n);for(let n=0;n<e;n++)for(let i=0;i<e;i++){let a=n,o=i;r[(n*e+i)*4]=(t.noise(a,o)*.5+.5)*255,r[(n*e+i)*4+1]=(t.noise(a+e,o)*.5+.5)*255,r[(n*e+i)*4+2]=(t.noise(a,o+e)*.5+.5)*255,r[(n*e+i)*4+3]=(t.noise(a+e,o+e)*.5+.5)*255}let i=new le(r,e,e,H,de);return i.wrapS=fe,i.wrapT=fe,i.needsUpdate=!0,i}};sn.OUTPUT={Off:-1,Default:0,Diffuse:1,Depth:2,Normal:3,AO:4,Denoise:5};var cn=class{renderer;composer;renderPass;bloom;ao;output=new Jt;fxaa=new Xt;copyMaterial=new J({name:`Aincrad screen composite`,uniforms:{tDiffuse:{value:null}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,fragmentShader:`uniform sampler2D tDiffuse; varying vec2 vUv; void main(){
        vec3 c=texture2D(tDiffuse,vUv).rgb;
        float l=dot(c,vec3(.2126,.7152,.0722));
        c+=vec3(.013,.002,-.008)*smoothstep(.35,.9,l)+vec3(-.005,.002,.009)*(1.-smoothstep(.1,.45,l));
        vec2 p=vUv*2.-1.; float vignette=1.-.11*dot(p*.65,p*.65);
        float grain=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.003;
        gl_FragColor=vec4(c*vignette+grain,1.);
      }`,depthTest:!1,depthWrite:!1,blending:0,toneMapped:!1});copy=new zt(this.copyMaterial);viewport=new b;scissor=new b;width=0;height=0;disposed=!1;constructor(e,t,n){this.renderer=e;let r=new w(8,8,{type:j,depthBuffer:!0,stencilBuffer:!1});r.texture.name=`Aincrad HDR`,this.composer=new Ut(e,r),this.composer.setPixelRatio(1),this.composer.renderToScreen=!1,this.renderPass=new Wt(t,n),this.ao=new sn(t,n,8,8),this.ao.blendIntensity=.62,this.ao.updateGtaoMaterial({radius:2.4,thickness:1.5,distanceFallOff:1,samples:12,screenSpaceRadius:!1}),this.ao.updatePdMaterial({radius:4,samples:8,rings:2});let i=this.ao.render.bind(this.ao);this.ao.render=(...e)=>{let t=[];this.ao.scene.traverse(e=>{if(!e.visible)return;let n=e,r=n.material?Array.isArray(n.material)?n.material:[n.material]:[];(e instanceof O||r.some(e=>e.transparent||e.alphaTest>0||e instanceof J))&&(t.push(e),e.visible=!1)});try{i(...e)}finally{t.forEach(e=>e.visible=!0)}},this.bloom=new Kt(new G(8,8),.16,.42,1.15),this.composer.addPass(this.renderPass),this.composer.addPass(this.ao),this.composer.addPass(this.bloom),this.composer.addPass(this.output),this.composer.addPass(this.fxaa)}render(e,t,n,r,i=0,a=`high`){if(this.disposed)return;let o=this.renderer,s=Math.min(o.getPixelRatio(),a===`high`?1.5:1),c=Math.max(8,Math.ceil(n*s/8)*8),l=Math.max(8,Math.ceil(r*s/8)*8);(c!==this.width||l!==this.height)&&(this.width=c,this.height=l,this.composer.setSize(c,l),this.ao.setSize(Math.ceil(c/2),Math.ceil(l/2))),this.renderPass.scene=e,this.renderPass.camera=t,this.ao.camera=t,this.ao.scene=e,this.ao.enabled=a===`high`,this.ao.updateGtaoMaterial({radius:t.name===`Aincrad cinematic camera`?12:2.4,thickness:t.name===`Aincrad cinematic camera`?5:1.5}),this.bloom.enabled=a===`high`,o.getViewport(this.viewport),o.getScissor(this.scissor);let u=o.getRenderTarget(),d=o.getScissorTest(),f=o.autoClear,p=o.toneMapping,m=o.toneMappingExposure;try{o.setScissorTest(!1),o.autoClear=!0,o.toneMapping=6,o.toneMappingExposure=1.03,this.composer.render(i),o.setRenderTarget(u),o.setViewport(this.viewport),o.setScissor(this.scissor),o.setScissorTest(d),o.autoClear=!1,this.copyMaterial.uniforms.tDiffuse.value=this.composer.readBuffer.texture,this.copy.render(o)}finally{o.setRenderTarget(u),o.setViewport(this.viewport),o.setScissor(this.scissor),o.setScissorTest(d),o.autoClear=f,o.toneMapping=p,o.toneMappingExposure=m}}dispose(){this.disposed||(this.disposed=!0,this.bloom.dispose(),this.ao.dispose(),this.ao.gtaoMaterial.dispose(),this.ao.blendMaterial.dispose(),this.output.dispose(),this.fxaa.dispose(),this.composer.dispose(),this.copyMaterial.dispose(),this.copy.dispose())}},ln=[{name:`銀葉巡林者`,color:5005910,accent:12427632,hair:13154711,skin:13147779},{name:`緋暮旅人`,color:6768201,accent:11049343,hair:3549217,skin:12159345},{name:`霧峰斥候`,color:5399403,accent:10987674,hair:10194039,skin:14070425},{name:`苔谷守望者`,color:6841672,accent:11638630,hair:4076582,skin:10252631},{name:`月河尋路人`,color:5198699,accent:10726574,hair:11842730,skin:13080703},{name:`琥珀遊俠`,color:7954758,accent:12756852,hair:7159856,skin:11830372}];function un(e,t=24){let n=[],r=[],i=[];e.forEach(([a,o,s,c=0],l)=>{for(let u=0;u<=t;u++){let d=u/t*Math.PI*2;if(n.push(Math.sin(d)*o,a,Math.cos(d)*s+c),r.push(u/t,l/(e.length-1)),l&&u){let e=l*(t+1)+u;i.push(e,e-1,e-t-2,e,e-t-2,e-t-1)}}});let a=new D;return a.setAttribute(`position`,new Oe(n,3)),a.setAttribute(`uv`,new Oe(r,2)),a.setIndex(i),a.computeVertexNormals(),a}function dn(e,t,n=6,r=12){return new c(new k(e.map(([e,t,n])=>new v(e,t,n))),r,t,n,!1)}function fn(e,t=!1){let n=t?[[.129,.914,-.042],[.335,1.008,-.031],[.193,.901,-.052],[.14,.885,-.05]]:[[.114,.936,.002],[.375,1.035,-.013],[.224,.886,-.003],[.138,.865,.006]],r=n.flatMap(([n,r,i])=>[n*e,r,i-(t?.002:.048)]);t||r.push(...n.flatMap(([t,n,r])=>[t*e,n,r+.018]));let i=new D,a=t?[0,1,2,0,2,3]:[0,1,2,0,2,3,6,5,4,7,6,4,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0];if(i.setAttribute(`position`,new Oe(r,3)),i.setAttribute(`uv`,new Oe(Array(r.length/3).fill([0,0]).flat(),2)),e<0)for(let e=0;e<a.length;e+=3)[a[e],a[e+2]]=[a[e+2],a[e]];return i.setIndex(a),i.computeVertexNormals(),i}function pn(){let e=new Uint8Array(16384);for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=(t*64+n)*4,i=(n*29+t*31+n*t*3)%13-6,a=205+(n%4<2?19:0)+(t%4<2?15:0)+i;e[r]=e[r+1]=e[r+2]=a,e[r+3]=255}let t=new le(e,64,64,H);return t.wrapS=t.wrapT=fe,t.repeat.set(5,5),t.magFilter=t.minFilter=N,t.needsUpdate=!0,t}function mn(e){e.updateMatrixWorld(!0);let t=e.matrixWorld.clone().invert(),r=new Map,i=new Set;e.traverse(e=>{if(!(e instanceof n)||Array.isArray(e.material))return;let a=e.geometry.index?e.geometry.toNonIndexed():e.geometry.clone();a.applyMatrix4(t.clone().multiply(e.matrixWorld));let o=r.get(e.material)??[];o.push(a),r.set(e.material,o),i.add(e.geometry)}),e.clear();for(let[t,n]of r){let r=U(n);r&&V(e,r,t),n.forEach(e=>e.dispose())}i.forEach(e=>e.dispose())}var hn=class{id;root=new p;rig=new p;limbs=[];eyes=new p;marker;materials=[];opacity=1;skin;head=new p;elbows=[];knees=[];cloak;cloakBase;cloakFrame=0;targetRotation=new z;targetEuler=new g(0,0,0,`YXZ`);constructor(e,t,i=e%10){this.id=e;let a=ln[(i%ln.length+ln.length)%ln.length];this.skin={name:a.name,color:a.color,accent:a.accent,type:`elf`},this.root.name=`castle-exclusive-elf`,this.root.userData.costume=a.name,this.root.userData.appearance=`elf`,this.root.add(this.rig);let o=pn(),c=(e,t=.8,n=0)=>new q({color:e,roughness:t,metalness:n}),l=new pe({color:a.skin,roughness:.62,metalness:0,sheen:.16,sheenColor:14990245,sheenRoughness:.85}),d=c(new s(a.skin).multiplyScalar(.8).getHex(),.74);d.side=2;let f=c(a.color,.93);f.map=o,f.bumpMap=o,f.bumpScale=.009;let m=c(4601643,.73);m.bumpMap=o,m.bumpScale=.004;let h=c(2959652,.83),g=c(a.accent,.41,.72),_=c(9601642,.9),v=c(a.hair,.72),y=c(new s(a.hair).lerp(new s(13219488),.23).getHex(),.69),b=c(4215626,.4),x=c(1120021,.3),S=c(12762026,.44),C=c(new s(a.skin).lerp(new s(7225401),.5).getHex(),.85),w=(e,t=20,n=12)=>new Ee(e,t,n),T=new p;this.rig.add(T),V(T,un([[-.11,.14,.088],[-.025,.157,.105],[.15,.123,.093],[.37,.18,.116],[.49,.209,.105],[.55,.173,.08],[.6,.061,.058]]),f),V(T,un([[.115,.133,.106],[.23,.14,.113],[.405,.19,.126],[.5,.195,.11]]),m),V(T,new r(.05,.059,.145,16),l,[0,.635,0]),V(T,un([[.565,.075,.066],[.64,.063,.058]]),f);let E=V(T,new u(.069,.008,5,24),_,[0,.639,0]);E.rotation.x=Math.PI/2,E.scale.y=.86;for(let e=0;e<5;e++){let t=.27+e*.045;V(T,dn([[-.022,t,-.126],[.024,t+.032,-.13]],.0032,4,1),_),V(T,dn([[.022,t,-.126],[-.024,t+.032,-.13]],.0032,4,1),_)}let D=V(T,W(.048,.59,.025,.009),h,[-.01,.315,-.138]);D.rotation.z=-.47;let O=V(T,W(.067,.075,.031,.004),g,[-.042,.4,-.156]);O.rotation.z=-.47,V(T,W(.027,.04,.015,.003),h,[-.042,.4,-.178]).rotation.z=-.47,V(T,un([[.065,.162,.116],[.135,.146,.116]]),h),V(T,W(.086,.066,.02,.006),g,[0,.1,-.125]),V(T,W(.057,.039,.025,.002),m,[0,.1,-.138]),V(T,new I(.007,.047,.008),g,[0,.1,-.154]);for(let e of[-1,1]){let t=V(T,W(.132,.28,.046,.015),f,[e*.081,-.083,-.086]);t.rotation.z=e*.11;let n=V(T,W(.007,.235,.012,.002),_,[e*.138,-.083,-.112]);n.rotation.z=e*.11,V(T,W(.13,.12,.08,.015),m,[e*.18,.07,0]),V(T,W(.115,.038,.084,.01),h,[e*.18,.105,-.003]),V(T,w(.011,8,6),g,[e*.18,.079,-.045]),V(T,w(.104),m,[e*.21,.495,.006],[1.08,.72,1.22]),V(T,w(.098),g,[e*.218,.515,.003],[1.08,.38,1.21]);for(let t of[-.082,.074])V(T,w(.008,8,6),g,[e*.236,.502,t]);V(T,w(.025,12,8),g,[e*.13,.515,-.105],[1,1,.35])}mn(T),this.rig.add(this.head);let k=new p;this.head.add(k,this.eyes),V(k,un([[.698,.021,.032,-.019],[.724,.061,.071,-.006],[.765,.09,.096,.003],[.821,.117,.114,.003],[.887,.125,.121,.002],[.96,.119,.123,.006],[1.019,.09,.105,.016],[1.046,.014,.026,.018]],32),l);for(let e of[-1,1]){V(k,fn(e),l),V(k,fn(e,!0),d),V(k,w(.041,16,10),l,[e*.081,.834,-.085],[1,.52,.53]);let t=V(k,w(.039,16,10),l,[e*.054,.927,-.103],[1.2,.35,.35]);t.rotation.z=e*-.13,V(k,dn([[e*.023,.934,-.117],[e*.052,.941,-.119],[e*.087,.931,-.107]],.0043,5,6),v),V(k,dn([[e*.019,.907,-.12],[e*.052,.919,-.127],[e*.089,.906,-.107]],.0027,4,6),C),V(this.eyes,w(.036,16,10),S,[e*.053,.905,-.111],[1,.32,.4]),V(this.eyes,w(.011,12,8),b,[e*.049,.905,-.125],[.94,1,.31]),V(this.eyes,w(.005,10,6),x,[e*.049,.905,-.129],[.85,1,.38]),V(this.eyes,w(.0019,8,6),S,[e*.049-.002,.909,-.132])}V(k,w(.032,16,12),l,[0,.873,-.12],[.48,1.7,.72]),V(k,w(.021,16,10),l,[0,.838,-.145],[.7,.66,.89]);for(let e of[-1,1])V(k,w(.012,12,8),l,[e*.015,.832,-.134],[.8,.6,.8]);V(k,dn([[-.033,.788,-.092],[-.012,.791,-.107],[0,.787,-.109],[.012,.791,-.107],[.033,.788,-.092]],.003,5,10),C),V(k,w(.027,16,8),l,[0,.768,-.08],[1.05,.33,.35]),V(k,new Ee(1,28,16,0,Math.PI*2,0,Math.PI*.6),v,[0,.966,.021],[.136,.112,.137]),V(k,w(.125,20,12),v,[0,.938,.07],[.95,1.07,.67]);for(let e=0;e<14;e++){let t=e/13*Math.PI*1.45-Math.PI*.225,n=Math.sin(t),r=Math.cos(t);V(k,dn([[n*.035,1.071,.032+r*.022],[n*.109,1.035,.023+r*.094],[n*.136,.959,.023+r*.128]],.0034,4,8),y)}for(let e=0;e<7;e++){let t=e*.011;V(k,dn([[.086-t,1.054,-.035],[.022-t,1.065,-.106],[-.065-t*.72,1.015-t*.22,-.131],[-.11-t*.1,.953-t*.55,-.089]],.009-e*5e-4,6,12),e%3?v:y)}for(let e of[-1,1]){V(k,dn([[e*.118,.991,.011],[e*.141,.92,.024],[e*.145,.808,.043],[e*.105,.708,.066]],.021,7,12),v);for(let t=0;t<8;t++)V(k,w(.018,12,8),t%2?v:y,[e*(.13+Math.sin(t*2.3)*.012),.84-t*.024,.053],[.7,1,.8]);let t=V(k,new u(.013,.004,5,10),g,[e*.131,.666,.053]);t.rotation.x=Math.PI/2}mn(k),mn(this.eyes),this.eyes.children.forEach(e=>e.position.y-=.905),this.eyes.position.y=.905;for(let e of[-1,1]){let t=new p;t.position.set(e*.232,.482,0);let n=new p;V(n,new Ce(.065,.165,6,14),f,[0,-.108,0],[1,1,.94]),V(n,new r(.068,.064,.044,14),m,[0,-.155,0]),mn(n);let i=new p;i.position.y=-.245,V(i,new Ce(.051,.15,6,14),f,[0,-.095,0]),V(i,un([[-.205,.044,.045],[-.17,.061,.052],[-.055,.054,.051]]),m),V(i,W(.056,.126,.024,.01),g,[0,-.12,-.049]);for(let e of[-.065,-.176])V(i,new r(.057,.056,.018,14),h,[0,e,0]);V(i,w(.043,14,10),l,[0,-.239,-.004],[.82,1.34,.59]),V(i,w(.016,10,8),l,[-e*.036,-.226,-.009],[.8,1.65,.85]),V(i,W(.059,.065,.024,.009),h,[0,-.223,.014]),mn(i),t.add(n,i),this.rig.add(t),this.limbs.push(t),this.elbows.push(i)}for(let e of[-1,1]){let t=new p;t.position.set(e*.086,-.02,0);let n=new p;V(n,new Ce(.074,.158,6,16),f,[0,-.134,0],[.94,1,1]),V(n,new r(.07,.063,.039,14),h,[0,-.177,0]),mn(n);let i=new p;i.position.y=-.29,V(i,new Ce(.051,.17,6,14),f,[0,-.137,0]),V(i,w(.059,14,10),m,[0,-.014,-.033],[.87,.86,.6]),V(i,un([[-.353,.064,.066],[-.25,.059,.06],[-.16,.065,.067],[-.125,.061,.063]]),m),V(i,new r(.068,.067,.025,14),h,[0,-.137,0]),V(i,w(.071,18,10),m,[0,-.365,-.042],[.93,.66,1.61]),V(i,W(.143,.035,.235,.014),h,[0,-.419,-.047]),V(i,W(.116,.028,.06,.005),g,[0,-.269,-.062]);for(let e=0;e<4;e++)V(i,dn([[-.025,-.168-e*.035,-.064],[.025,-.191-e*.035,-.066]],.003,4,1),_);mn(i),t.add(n,i),this.rig.add(t),this.limbs.push(t),this.knees.push(i)}let A=new K(1,1,14,22),j=A.getAttribute(`position`),ee=A.getAttribute(`uv`),te=[];for(let e=0;e<j.count;e++){let t=ee.getX(e),n=1-ee.getY(e);j.setXYZ(e,(t-.5)*(.365+n*.335),.555-n*1.02,.13+n*.16+Math.cos(t*Math.PI*10)*.015*n);let r=t<.075||t>.925||n>.956,i=new s(r?a.accent:16777215);r&&i.lerp(new s(16777215),.35),te.push(i.r,i.g,i.b)}A.setAttribute(`color`,new Oe(te,3)),A.computeVertexNormals(),this.cloakBase=new Float32Array(j.array);let M=f.clone();M.color.multiplyScalar(.66),M.side=2,M.vertexColors=!0,this.cloak=V(this.rig,A,M),this.cloak.name=`animated-woven-cloak`,t!==null&&(this.marker=V(this.root,new F(.071,0),new q({color:t===0?13810813:9550528,emissive:t===0?8413233:3433582,emissiveIntensity:.4,roughness:.36,metalness:.6}),[0,1.42,0]),this.marker.castShadow=!1);let N=new Set;this.root.traverse(e=>{if(e instanceof n)for(let t of Array.isArray(e.material)?e.material:[e.material])N.add(t)}),this.materials=[...N]}setOpacity(e){if(e=P.clamp(e,0,1),this.opacity!==e){this.opacity=e;for(let t of this.materials){let n=e<1;t.alphaHash!==n&&(t.alphaHash=n,t.needsUpdate=!0),t.opacity=e}}}animate(e,t,n,r,i){let a=e===`run`,o=e===`airborne`,s=e===`finished`,c=t*Math.max(n,1)*2.55,l=Math.sin(c),u=Math.min(1,n/4.5);if(this.rig.position.y=a?Math.abs(l)*.021*u:Math.sin(t*1.9+this.id)*.004,e!==`stumble`){this.targetEuler.set(e===`dive`?-Math.PI/2:a?-.067:0,r,a?l*.016:0,`YXZ`),this.targetRotation.setFromEuler(this.targetEuler),this.rig.quaternion.slerp(this.targetRotation,1-Math.exp(-Math.max(i,.001)*13));for(let n=0;n<2;n++){let r=n===0?-1:1,i=l*r;this.limbs[n].rotation.set(a?i*.67*u:s?2.48+Math.sin(t*4+n)*.12:o?.55:e===`dive`?2.75:.07,0,r*(o?.3:.105)),this.elbows[n].rotation.x=a?.42+Math.max(0,-i)*.3:s?.18:.16,this.limbs[n+2].rotation.x=a?-i*.66*u:o?n?.28:-.38:e===`dive`?-.12:0,this.knees[n].rotation.x=a?-Math.max(0,i)*.97*u:o?-.65:-.025}}this.head.rotation.y=Math.sin(t*.62+this.id)*(a?.015:.035),this.eyes.scale.y=Math.sin(t*1.15+this.id*.7)>.995?.08:1;let d=this.cloak.geometry.getAttribute(`position`),f=this.cloak.geometry.getAttribute(`uv`);for(let e=0;e<d.count;e++){let n=1-f.getY(e),r=f.getX(e),i=n*n;d.setXYZ(e,this.cloakBase[e*3]+Math.sin(t*2.6+n*3+this.id)*i*.022,this.cloakBase[e*3+1]+(a?.12*u:.01)*i,this.cloakBase[e*3+2]+i*((a?.14*u:.02)+Math.sin(t*(a?7:2.5)-n*5+r*4+this.id)*(a?.045:.018)))}d.needsUpdate=!0,++this.cloakFrame%3==0&&this.cloak.geometry.computeVertexNormals(),this.marker&&(this.marker.position.y=1.42+Math.sin(t*2)*.035,this.marker.rotation.y=t*.45)}},gn=class extends ve{neighbors=[];lane;constructor(e,t){let n=(e.id%3-1)*2.35,r=t.map((e,r)=>{if(r>=t.length-2)return e.clone();let i=r%96,a=i>=42&&i<=52?.24:1,o=t[r+1].clone().sub(e).normalize(),s=new v(0,1,0).cross(o).normalize();return e.clone().addScaledVector(s,n*a)});super(e,r),this.lane=n}decide(t,n){let r=t>=this.nextReaction,i=super.decide(t,n),a=this.actor;if(r&&(this.nextReaction=t+.04+(1-a.skill)*.045),!a.active||a.machine.state===`respawn`)return i;if(!a.grounded){let t=a.world.castRay(new e.Ray(a.current,{x:0,y:-1,z:0}),2.5,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,e=>!(e.collisionGroups()>>>16&1));return{...i,jump:a.doubleJumpEnabled&&a.airJumpAvailable&&a.body.linvel().y<.2&&!t}}let o=Math.hypot(i.x,i.z);if(o<.01)return i;let s=i.x/o,c=i.z/o,l=e=>!(e.collisionGroups()>>>16&1),u=!1;for(let t of[.7,1.15]){let n=a.world.castRay(new e.Ray({x:a.current.x+s*t,y:a.current.y,z:a.current.z+c*t},{x:0,y:-1,z:0}),2.25,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,l);(!n||n.timeOfImpact<.4)&&(u=!0)}let d=a.world.castRay(new e.Ray({x:a.current.x,y:a.current.y-.1,z:a.current.z},{x:s,y:0,z:c}),3.5,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,e=>!!(e.collisionGroups()>>>16&4)),f=.93+a.skill*.07;for(let e of this.neighbors){if(e===a||!e.active||Math.abs(e.current.y-a.current.y)>1.5)continue;let t=e.current.x-a.current.x,n=e.current.z-a.current.z,r=t*s+n*c,i=t*c-n*s;r>.2&&r<2.2&&Math.abs(i)<.85&&!u&&(f*=.82)}return d&&!u&&(f=d.timeOfImpact<1.7?0:.65),i={...i,x:i.x*f,z:i.z*f},{...i,jump:u||!d&&this.stuckTime>.8}}};export{gn as AincradBrain,Pt as AincradCinematic,cn as AincradPostProcessing,hn as ElfAppearance,$e as aincradMeadowHeight,ft as createAincradCourse,at as createAincradWorld,Dt as createFloatingPark};