import{a as e,r as t}from"./world-CeqXiYg9.js";import{$ as n,A as r,At as i,B as a,C as o,Ct as s,D as c,Dt as l,E as u,Et as d,F as f,Ft as p,G as m,H as h,I as g,It as _,J as v,K as y,Lt as b,M as x,Mt as S,N as C,Nt as w,O as T,Ot as E,P as D,Pt as O,Q as k,R as ee,S as A,St as te,T as ne,Tt as j,U as M,W as re,X as ie,Y as ae,Z as oe,_ as se,_t as N,a as ce,at as le,b as ue,bt as de,ct as fe,d as pe,dt as P,et as F,f as I,ft as me,g as he,gt as ge,h as L,ht as _e,i as ve,it as R,j as z,jt as ye,k as be,kt as B,lt as xe,mt as Se,nt as Ce,ot as V,pt as H,q as we,rt as Te,st as Ee,t as De,tt as Oe,u as ke,ut as Ae,v as je,vt as Me,w as Ne,wt as U,x as W,xt as Pe,y as Fe,z as Ie}from"./ai-28no3lZY.js";import{c as Le,i as G,l as Re,o as ze,r as K,t as Be,u as Ve}from"./floating-world-JzqYEDgd.js";var He=class e extends F{constructor(){let t=e.SkyShader,n=new Pe({name:t.name,uniforms:ye.clone(t.uniforms),vertexShader:t.vertexShader,fragmentShader:t.fragmentShader,side:1,depthWrite:!1});super(new W(1,1,1),n),this.isSky=!0}};He.SkyShader={name:`SkyShader`,uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new p},up:{value:new p(0,1,0)},cloudScale:{value:2e-4},cloudSpeed:{value:1e-4},cloudCoverage:{value:.4},cloudDensity:{value:.4},cloudElevation:{value:.5},showSunDisc:{value:1},time:{value:0}},vertexShader:`
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

		}`};function q(e,t){let n=Math.sin(e*127.1+t*311.7)*43758.5453123;return n-Math.floor(n)}function Ue(e,t){let n=Math.floor(e),r=Math.floor(t),i=e-n,a=t-r;return i=i*i*(3-2*i),a=a*a*(3-2*a),k.lerp(k.lerp(q(n,r),q(n+1,r),i),k.lerp(q(n,r+1),q(n+1,r+1),i),a)}function We(e,t){let n=0,r=.5;for(let i=0;i<5;i++)n+=Ue(e,t)*r,e=e*2.03+17.1,t=t*2.03+9.2,r*=.5;return n}function Ge(e,t,n=!1){let r=new x(e,t,t,Se);return r.wrapS=r.wrapT=ge,r.magFilter=ie,r.minFilter=oe,r.generateMipmaps=!0,r.anisotropy=8,n&&(r.colorSpace=Me),r.needsUpdate=!0,r}function Ke(e){let t=e===`stone`?1024:512,n=new Uint8Array(t*t*4),r=new Uint8Array(t*t*4),i=new Uint8Array(t*t*4),a=new Float32Array(t*t);for(let r=0;r<t;r++)for(let o=0;o<t;o++){let s=r*t+o,c=s*4,l=q(o,r),u=(Math.sin(Math.PI*o/t)*Math.sin(Math.PI*r/t))**.5,d=o*256/t,f=r*256/t,p=.5+(We(d/23,f/23)-.5)*u,m=.5+(We(d/84,f/84)-.5)*u,h=p*.7+l*.08,g=160,_=160,v=148;if(e===`stone`){let e=Math.floor(f/32),t=(d+e%2*32)%64,n=f%32,r=t<.65+l*.3||t>63.35||n<.65+l*.3||n>31.35,i=q(Math.floor((d+e%2*32)/64),e),a=Math.abs(Math.sin(d*.12+f*.09+p*15))<.024,o=(r?.51:.65+i*.23)*(.79+p*.25+m*.14)+(l-.5)*.08-(a?.08:0);g=o*205,_=o*202,v=o*185,h=(r?.29:.65+i*.12)+p*.2+l*.09}else if(e===`rock`){let e=We(d/12,f/12)*u,t=.49+p*.32+e*.08;g=t*131,_=t*143,v=t*142,h=p*.6+e*.27+l*.1}else{let e=.6+p*.5+l*.11;g=e*108,_=e*124,v=e*58,h=p*.65+l*.35}n[c]=g,n[c+1]=_,n[c+2]=v,n[c+3]=255,a[s]=h;let y=e===`stone`?175+m*67:215+m*36;i[c]=i[c+1]=i[c+2]=y,i[c+3]=255}let o=new p;for(let e=0;e<t;e++)for(let n=0;n<t;n++){let i=(r,i)=>a[(e+i+t)%t*t+(n+r+t)%t];o.set((i(-1,0)-i(1,0))*1.7,(i(0,-1)-i(0,1))*1.7,1).normalize();let s=(e*t+n)*4;r[s]=(o.x*.5+.5)*255,r[s+1]=(o.y*.5+.5)*255,r[s+2]=(o.z*.5+.5)*255,r[s+3]=255}return{map:Ge(n,t,!0),normalMap:Ge(r,t),roughnessMap:Ge(i,t)}}function qe(){let e=Ke(`stone`),t=Ke(`rock`),n=Ke(`grass`),r=new Uint8Array(262144);for(let e=0;e<256;e++)for(let t=0;t<256;t++){let n=(e*256+t)*4,i=t/256,a=e/256,o=Math.abs(Math.sin((i+a*.5)*Math.PI*12))<.075||Math.abs(Math.sin((i-a*.5)*Math.PI*12))<.075,s=new T([2116965,6454396,12096594,5464657,4282745][Math.floor(q(Math.floor(i*12+a*6),Math.floor(i*12-a*6))*5)]),c=o?.08:.8+q(t,e)*.2;r[n]=Math.sqrt(s.r)*255*c,r[n+1]=Math.sqrt(s.g)*255*c,r[n+2]=Math.sqrt(s.b)*255*c,r[n+3]=255}let i=Ge(r,256,!0),a=new R({...e,color:13223865,roughness:.9,normalScale:new O(.48,.48)}),o=new R({...e,color:13353388,roughness:.79,normalScale:new O(.78,.78)}),s=new R({...e,color:14802377,roughness:.86,normalScale:new O(.28,.28)}),c={stone:a,path:o,limestone:s,rock:new R({...t,color:9213585,roughness:1,normalScale:new O(1.05,1.05)}),grass:new R({...n,color:9083492,roughness:1,normalScale:new O(.3,.3)}),bronze:new R({color:5402473,roughness:.57,metalness:.64}),gold:new R({color:12360541,roughness:.46,metalness:.72}),window:new R({color:13950935,map:i,emissiveMap:i,roughness:.19,metalness:.28,emissive:16764800,emissiveIntensity:.35,side:2}),foliage:new R({color:4808509,roughness:1}),bark:new R({...t,color:7496269,roughness:1})};return a.name=s.name=`Aincrad masonry`,o.name=`Aincrad paving`,{...c,dispose(){for(let e of Object.values(c))e.dispose();for(let r of[e,t,n])for(let e of Object.values(r))e.dispose();i.dispose()}}}function Je(e=0){let t=new Uint8Array(65536),n=(t,n)=>Math.sin((t*4+n*2)*Math.PI*2/128+e)*.55+Math.sin((t*9-n*7)*Math.PI*2/128+e*1.3)*.22+Math.cos((t*17+n*13)*Math.PI*2/128)*.1,r=new p;for(let e=0;e<128;e++)for(let i=0;i<128;i++){r.set((n(i-1,e)-n(i+1,e))*.7,(n(i,e-1)-n(i,e+1))*.7,1).normalize();let a=(e*128+i)*4;t[a]=(r.x*.5+.5)*255,t[a+1]=(r.y*.5+.5)*255,t[a+2]=(r.z*.5+.5)*255,t[a+3]=255}return Ge(t,128)}function Ye(){let e=document.createElement(`canvas`);e.width=e.height=256;let t=e.getContext(`2d`);t.lineCap=`round`;let n=(e,n,r,i,a,o)=>{t.beginPath(),t.moveTo(e,n),t.lineTo(r,i),t.strokeStyle=a,t.lineWidth=o,t.stroke()};n(128,250,128,18,`#65583b`,3);for(let e=0;e<20;e++)for(let t of[-1,1]){let r=236-e*10,i=128+t*((1-e/23)*105),a=r-33;n(128,r,i,a,`#465c34`,1.7);for(let o=0;o<24;o++){let s=o/24,c=128+(i-128)*s,l=r+(a-r)*s,u=q(e,o)>.5?`#577340`:`#8b9a61`;n(c,l,c+t*(6+q(o,e)*9),l-8-q(e,o)*12,u,1.4),n(c,l,c+t*9,l+6,u,1.1)}}let r=new Ne(e);r.colorSpace=Me,r.anisotropy=8;let i=new R({map:r,roughness:1,side:2,alphaTest:.42,color:10728859}),a=[];for(let e=0;e<13;e++)for(let t=0;t<5;t++){let n=.5*(1-e/15),r=.26,i=t/5*Math.PI*2+e*.77,o=new P(n,r,1,2);o.rotateX(-.5),o.translate(0,r/2,n*.22),o.rotateY(i),o.translate(0,.09+e*.059,0),a.push(o)}let o=he(a);return a.forEach(e=>e.dispose()),{geometry:o,material:i,map:r}}var Xe=Math.PI*2,Ze=e=>484-(e-80)*.55;function Qe(e=!1){let t=(e,t,n,r)=>{e.moveTo(-t,n),e.lineTo(t,n),e.lineTo(t,r*.58),e.quadraticCurveTo(t*.95,r*.82,0,r),e.quadraticCurveTo(-t*.95,r*.82,-t,r*.58),e.closePath()},n=new te;return e?(n.moveTo(-.5,0),n.lineTo(-.5,.58),n.quadraticCurveTo(-.475,.82,0,1),n.quadraticCurveTo(.475,.82,.5,.58),n.lineTo(.5,0),n.lineTo(.365,0),n.lineTo(.365,.51),n.quadraticCurveTo(.347,.72,0,.88),n.quadraticCurveTo(-.347,.72,-.365,.51),n.lineTo(-.365,0),n.closePath()):t(n,.5,0,1),new Ie(n,{depth:e?.18:.035,bevelEnabled:e,bevelSize:.018,bevelThickness:.018,bevelSegments:1,steps:1,curveSegments:5})}var $e=class{root;batches=new Map;constructor(e){this.root=e}add(e,t,r,i,a,o=new H,s=new T(1,1,1)){let c=this.batches.get(e);c||(c={geometry:t,material:r,matrices:[],colors:[]},this.batches.set(e,c)),c.matrices.push(new n().compose(i,o,a)),c.colors.push(s)}finish(){for(let[e,t]of this.batches){let n=t.geometry,r=t.material;if(r instanceof R&&/masonry|paving/.test(r.name)){r=r.clone(),n=n.clone();let e=new Float32Array(t.matrices.length*3);t.matrices.forEach((t,n)=>{let r=t.elements;e[n*3]=Math.hypot(r[0],r[1],r[2]),e[n*3+1]=Math.hypot(r[4],r[5],r[6]),e[n*3+2]=Math.hypot(r[8],r[9],r[10])}),n.setAttribute(`masonrySize`,new we(e,3));let i=/Cylinder|Cone/.test(n.type);r.onBeforeCompile=e=>{e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
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
            #endif`)},r.customProgramCacheKey=()=>`masonry-metres-${i}`}let i=new v(n,r,t.matrices.length);i.name=e,i.castShadow=!0,i.receiveShadow=!0,t.matrices.forEach((e,n)=>{i.setMatrixAt(n,e),i.setColorAt(n,t.colors[n])}),i.computeBoundingSphere(),this.root.add(i)}}};function et(e,t){let n=new M;n.name=`Ten terraced districts and the crown cathedral`,e.add(n);let i=new $e(n),a=new W(1,1,1),o=new z(1,1,1,16),s=new r(1,1,8),c=new r(1,1,4);c.rotateY(Math.PI/4);let l=Qe(),u=Qe(!0),d=l.getAttribute(`uv`);for(let e=0;e<d.count;e++)d.setX(e,d.getX(e)+.5);let f=t.stone.clone();f.color.set(14537917);let m=t.rock.clone();m.color.set(4545889),m.roughness=.65;let h=t.window.clone();h.emissive.set(16760160),h.emissiveIntensity=.36;let g=(e,t,n)=>new p(e,t,n),_=e=>new H().setFromAxisAngle(g(0,1,0),e),v=(e,t,n,r,a,o=0,s=1)=>i.add(e,t,n,r,a,[`Recessed grand arcade openings`,`Carved gothic archivolts`,`Hundred floors of recessed windows`,`Window surrounds`].includes(e)?_(o).multiply(new H().setFromAxisAngle(g(1,0,0),-Math.atan(.55))):_(o),new T(s,s*.99,s*.96)),b=(e,t,n)=>g(Math.sin(e)*t,n,Math.cos(e)*t),x=(e,t,r,i,a,o)=>{let s=new z(r-.55*i,r,i,192,1,!0),c=s.getAttribute(`uv`);for(let e=0;e<c.count;e++)c.setXY(e,c.getX(e)*r*Xe/4,c.getY(e)*i/4.8);let l=new F(s,o);if(l.position.y=t+i/2,l.castShadow=l.receiveShadow=!0,l.name=e,n.add(l),a){let e=new F(new N(r-a,r,192),o),s=e.geometry.getAttribute(`position`),c=e.geometry.getAttribute(`uv`);for(let e=0;e<c.count;e++)c.setXY(e,s.getX(e)/4,s.getY(e)/4.8);e.rotation.x=-Math.PI/2,e.position.y=t+i,e.receiveShadow=!0,n.add(e)}};x(`Continuous inner castle mass behind the arcades`,80,455,540,0,f);for(let e=0;e<10;e++){let n=80+e*54,r=Ze(n);x(`District ${e+1} weathered retaining wall`,n,r-19,43,24,f),x(`Shadowed basal plinth`,n-.4,r+3.5,2.4,10,t.limestone),x(`Broad planted terrace`,n+48,Ze(n+48)+7,2.8,34,t.limestone);for(let e=1;e<10;e++)x(`Minor masonry cornice`,n+e*5.4,Ze(n+e*5.4)-18.4,.38,0,e%3==0?t.limestone:f);let i=72-e*3;for(let r=0;r<i;r++){let o=r/i*Xe,d=Ze(n+4)-5.65,p=.79+q(r,e+31)*.26;v(`Recessed grand arcade openings`,l,h,b(o,d,n+4),g(8,17,.8),o),v(`Carved gothic archivolts`,u,t.limestone,b(o,d+.5,n+4),g(8.5,18,1.8),o,p),v(`Arcade central mullions`,a,t.limestone,b(o,d+.8,n+11),g(.42,13,.9),o);for(let e of[-2.15,2.15]){let r=b(o,d+.8,n+10).add(g(Math.cos(o)*e,0,-Math.sin(o)*e));v(`Arcade slender mullions`,a,t.limestone,r,g(.24,11,.7),o)}v(`Arcade horizontal tracery`,a,t.limestone,b(o,Ze(n+12)-4.9,n+12),g(7.5,.35,.65),o);for(let i=5;i<9;i++){let a=n+i*5.4,s=Ze(a)-18.3;v(`Hundred floors of recessed windows`,l,h,b(o,s,a),g(2.1,3.2,1),o,.6+q(r+i,e)*.4),v(`Window surrounds`,u,t.limestone,b(o,s+.12,a-.1),g(2.5,3.5,.6),o,p)}let _=o+Math.PI/i;if(v(`Load-bearing tapered piers`,a,f,b(_,Ze(n+18)-1,n+19),g(1.8,34,6),_,p),v(`Carved capital blocks`,a,t.limestone,b(_,Ze(n+34),n+34),g(3.2,1.1,6.7),_),r%2==0){let i=n+48,u=7+q(r,e+2)*7,d=Ze(i+u)-3;v(`Terrace town houses`,a,f,b(o,d,i+u/2),g(7.2,u,9),o,p),v(`Clustered steep slate roofs`,c,m,b(o,d,i+u+4.5),g(6.4,9,8),o),v(`Townhouse glazed bays`,l,h,b(o,d+4.7,i+2),g(2.3,3.9,1),o),v(`Roof gilded finials`,s,t.gold,b(o,d,i+u+10),g(.24,2.8,.24),o),v(`Terrace cypress trees`,s,t.foliage,b(o+.014,Ze(i+9)-13,i+7),g(2.3,12,2.3),o)}}for(let r=0;r<12;r++){let i=r/12*Xe+e%2*.12,a=n+15,c=Ze(n+36)+6;v(`District bastion shafts`,o,f,b(i,c,a),g(7.5,30,7.5),i),v(`Bastion machicolations`,o,t.limestone,b(i,c,n+31),g(8.6,2.4,8.6),i),v(`Bastion slate spires`,s,m,b(i,c,n+40),g(8.8,17,8.8),i),v(`Golden bastion tips`,s,t.gold,b(i,c,n+50),g(.45,5,.45),i);for(let e=-1;e<=1;e++){let t=i+e*.045;v(`Bastion arrow slits`,l,h,b(t,c+7.4,n+18),g(1.3,6,1),t)}}}let S=new z(488,65,177,192,16),C=S.getAttribute(`position`);for(let e=0;e<C.count;e++){let t=C.getX(e),n=C.getY(e),r=C.getZ(e),i=Math.atan2(r,t),a=(Math.sin(i*17+n*.024)*6+Math.sin(i*41-n*.033)*4)*(1-(n+88.5)/177);C.setXYZ(e,t+Math.cos(i)*a,n+Math.sin(i*23)*3,r+Math.sin(i)*a)}S.computeVertexNormals();let w=new F(S,t.rock);w.position.y=-14,w.castShadow=w.receiveShadow=!0,n.add(w);let E=new y(1,1);for(let e=0;e<100;e++){let n=e/100*Xe,r=-25-q(e,73)*75,i=(65+(r+102)/177*423)*(.85+q(e,11)*.14);v(`Fractured floating rock strata`,E,t.rock,b(n,i,r),g(25+q(e,4)*24,22+q(e,9)*60,22),n)}x(`Grand foundation rim`,74,491,6,28,t.limestone),x(`Summit sanctuary terrace`,616,184,4,183,f);let D=(e,n,r,i,o,d=0)=>{v(`Cathedral limestone walls`,a,f,g(e,620+o/2,n),g(r,o,i),d),v(`Cathedral pitched roofs`,c,m,g(e,620+o+10,n),g(r*.76,24,i*.75),d);for(let c=-1;c<=1;c+=2)for(let f=0;f<6;f++){let p=g(c*(r/2+.15),12,-i/2+6+f*(i-12)/5).applyQuaternion(_(d)).add(g(e,620,n));v(`Cathedral lancet glass`,l,h,p,g(4,18,1),d+c*Math.PI/2),v(`Cathedral tracery`,u,t.limestone,p.clone().add(g(c*.3,0,0).applyQuaternion(_(d))),g(4.8,19,2),d+c*Math.PI/2);let m=g(c*(r/2+5),o*.43,-i/2+f*i/5).applyQuaternion(_(d)).add(g(e,620,n));v(`Cathedral flying buttresses`,a,t.limestone,m,g(2,o*.86,3),d),v(`Buttress pinnacles`,s,t.limestone,m.clone().add(g(0,o*.43+6,0)),g(2.4,12,2.4),d)}};D(0,0,40,142,44),D(0,0,30,119,37,Math.PI/2);for(let e=0;e<13;e++){let n=e/12*Xe,r=e===12,i=r?0:99,a=r?106:38+e%3*15,c=r?18:8;v(`Cathedral bell towers`,o,f,b(n,i,620+a/2),g(c,a,c),n),v(`Tower cornices`,o,t.limestone,b(n,i,620+a),g(c*1.13,3.2,c*1.13),n),v(`Cathedral needle roofs`,s,m,b(n,i,620+a+(r?35:20)),g(c*1.2,r?70:40,c*1.2),n),v(`Cathedral golden finials`,s,t.gold,b(n,i,620+a+(r?76:46)),g(.7,12,.7),n);for(let e=0;e<8;e++){let o=e/8*Xe,s=b(n,i,620+a-18).add(b(o,c+.2,0));v(`Bell tower openings`,l,h,s,g(r?4.5:2.6,13,1),o),v(`Bell tower frames`,u,t.limestone,s,g(r?5.2:3.2,14,1.5),o)}}i.finish()}var tt=class e extends F{constructor(t,r={}){super(t),this.isReflector=!0,this.type=`Reflector`,this.forceUpdate=!1,this._reflectionCameras=new WeakMap;let i=this,a=r.color===void 0?new T(8355711):new T(r.color),o=r.textureWidth||512,s=r.textureHeight||512,c=r.clipBias||0,l=r.shader||e.ReflectorShader,u=r.multisample===void 0?4:r.multisample,d=new Ae,f=new p,m=new p,h=new p,g=new n,v=new p(0,0,-1),y=new _,x=new p,S=new p,C=new _,w=new n,E=new b(o,s,{samples:u,type:re}),D=new Pe({name:l.name===void 0?`unspecified`:l.name,uniforms:ye.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});D.uniforms.tDiffuse.value=E.texture,D.uniforms.color.value=a,D.uniforms.textureMatrix.value=w,this.material=D,this.onBeforeRender=function(e,t,n){let r=this.getReflectionCamera(n);if(m.setFromMatrixPosition(i.matrixWorld),h.setFromMatrixPosition(n.matrixWorld),g.extractRotation(i.matrixWorld),f.set(0,0,1),f.applyMatrix4(g),x.subVectors(m,h),x.dot(f)>0&&this.forceUpdate===!1)return;x.reflect(f).negate(),x.add(m),g.extractRotation(n.matrixWorld),v.set(0,0,-1),v.applyMatrix4(g),v.add(h),S.subVectors(m,v),S.reflect(f).negate(),S.add(m),r.position.copy(x),r.up.set(0,1,0),r.up.applyMatrix4(g),r.up.reflect(f),r.lookAt(S),r.far=n.far,r.updateMatrixWorld(),r.projectionMatrix.copy(n.projectionMatrix),w.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),w.multiply(r.projectionMatrix),w.multiply(r.matrixWorldInverse),w.multiply(i.matrixWorld),d.setFromNormalAndCoplanarPoint(f,m),d.applyMatrix4(r.matrixWorldInverse),y.set(d.normal.x,d.normal.y,d.normal.z,d.constant);let a=r.projectionMatrix;r.isOrthographicCamera?(C.x=(Math.sign(y.x)+a.elements[8])/a.elements[0],C.y=(Math.sign(y.y)+a.elements[9])/a.elements[5],C.z=-n.far,C.w=1):(C.x=(Math.sign(y.x)+a.elements[8])/a.elements[0],C.y=(Math.sign(y.y)+a.elements[9])/a.elements[5],C.z=-1,C.w=(1+a.elements[10])/a.elements[14]),y.multiplyScalar(2/y.dot(C)),a.elements[2]=y.x,a.elements[6]=y.y,r.isOrthographicCamera?(a.elements[10]=y.z-c,a.elements[14]=y.w-1):(a.elements[10]=y.z+1-c,a.elements[14]=y.w),i.visible=!1;let o=e.getRenderTarget(),s=e.xr.enabled,l=e.shadowMap.autoUpdate;e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(E),e.state.buffers.depth.setMask(!0),e.autoClear===!1&&e.clear(),e.render(t,r),e.xr.enabled=s,e.shadowMap.autoUpdate=l,e.setRenderTarget(o);let u=n.viewport;u!==void 0&&e.state.viewport(u),i.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return E},this.dispose=function(){E.dispose(),i.material.dispose()},this.getReflectionCamera=function(e){let t=this._reflectionCameras.get(e);return t===void 0&&(t=e.clone(),this._reflectionCameras.set(e,t)),t}}};tt.ReflectorShader={name:`ReflectorShader`,uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
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

		}`};function nt(e,t){let r=new P(1,1),i=new tt(r,{textureWidth:512,textureHeight:512,multisample:0,clipBias:.002,shader:{name:`Rain puddle with scene reflection and capillary ripples`,uniforms:{color:{value:new T(6716795)},tDiffuse:{value:null},textureMatrix:{value:new n},time:{value:0}},vertexShader:`uniform mat4 textureMatrix; varying vec4 projected; varying vec2 wetUv; varying vec3 eye; varying vec3 planeNormal;
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
        }`}});i.name=`Shallow rainwater · live reflected castle and runners`;let a=i.material;a.transparent=!0,a.depthWrite=!1,a.polygonOffset=!0,a.polygonOffsetFactor=-1,i.renderOrder=2,e.add(i);let o=Le.slice(0,-1).flatMap((e,t)=>t%2==0&&![6,22,38,44,46,48,50,70,86].includes(t%96)?[{index:t,p:e.clone().lerp(Le[t+1],.24)}]:[]),s=i.onBeforeRender,c=null,l=!1,u=!0,d=new _,f=new _;return i.onBeforeRender=(...e)=>{if(l||e[2]!==c||e[1].overrideMaterial)return;let n=e[0],r=t.visible,a=n.getScissorTest();n.getViewport(d),n.getScissor(f),l=!0,t.visible=!1;try{n.setScissorTest(!1),s.apply(i,e)}finally{t.visible=r,n.setViewport(d),n.setScissor(f),n.setScissorTest(a),l=!1}},{prepareCamera(e){if(c=e,!u){i.visible=!1;return}let t=o[0],r=1/0;for(let n of o){let i=n.p.distanceToSquared(e.position);i<r&&(r=i,t=n)}if(i.visible=r<3025,!i.visible)return;let a=Le[t.index+1].clone().sub(Le[t.index]).normalize(),s=new p().crossVectors(new p(0,1,0),a).normalize(),l=new p().crossVectors(a,s).normalize();i.quaternion.setFromRotationMatrix(new n().makeBasis(s,a.clone().negate(),l)),i.position.copy(t.p).addScaledVector(l,.043).addScaledVector(s,t.index%4==0?-.85:.85),i.scale.set(4.6,9.5,1),i.updateMatrixWorld()},update(e){a.uniforms.time.value=e},setEnabled(e){u=e,i.visible=e},setQuality(e,t){i.getRenderTarget().setSize(e&&!t?640:320,e&&!t?640:320)},dispose(){i.onBeforeRender=()=>{},i.removeFromParent(),i.dispose(),r.dispose()}}}var rt=class e extends F{constructor(t,r={}){super(t),this.isRefractor=!0,this.type=`Refractor`,this.camera=new xe;let i=this,a=r.color===void 0?new T(8355711):new T(r.color),o=r.textureWidth||512,s=r.textureHeight||512,c=r.clipBias||0,l=r.shader||e.RefractorShader,u=r.multisample===void 0?4:r.multisample,d=this.camera;d.matrixAutoUpdate=!1,d.userData.refractor=!0;let f=new Ae,m=new n,h=new b(o,s,{samples:u,type:re});this.material=new Pe({name:l.name===void 0?`unspecified`:l.name,uniforms:ye.clone(l.uniforms),vertexShader:l.vertexShader,fragmentShader:l.fragmentShader,transparent:!0}),this.material.uniforms.color.value=a,this.material.uniforms.tDiffuse.value=h.texture,this.material.uniforms.textureMatrix.value=m;let g=(function(){let e=new p,t=new p,r=new n,a=new p,o=new p;return function(n){return e.setFromMatrixPosition(i.matrixWorld),t.setFromMatrixPosition(n.matrixWorld),a.subVectors(e,t),r.extractRotation(i.matrixWorld),o.set(0,0,1),o.applyMatrix4(r),a.dot(o)<0}})(),v=(function(){let e=new p,t=new p,n=new H,r=new p;return function(){i.matrixWorld.decompose(t,n,r),e.set(0,0,1).applyQuaternion(n).normalize(),e.negate(),f.setFromNormalAndCoplanarPoint(e,t)}})(),y=(function(){let e=new Ae,t=new _,n=new _;return function(r){d.matrixWorld.copy(r.matrixWorld),d.matrixWorldInverse.copy(d.matrixWorld).invert(),d.projectionMatrix.copy(r.projectionMatrix),d.far=r.far,e.copy(f),e.applyMatrix4(d.matrixWorldInverse),t.set(e.normal.x,e.normal.y,e.normal.z,e.constant);let i=d.projectionMatrix;n.x=(Math.sign(t.x)+i.elements[8])/i.elements[0],n.y=(Math.sign(t.y)+i.elements[9])/i.elements[5],n.z=-1,n.w=(1+i.elements[10])/i.elements[14],t.multiplyScalar(2/t.dot(n)),i.elements[2]=t.x,i.elements[6]=t.y,i.elements[10]=t.z+1-c,i.elements[14]=t.w}})();function x(e){m.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),m.multiply(e.projectionMatrix),m.multiply(e.matrixWorldInverse),m.multiply(i.matrixWorld)}function S(e,t,n){i.visible=!1;let r=e.getRenderTarget(),a=e.xr.enabled,o=e.shadowMap.autoUpdate;e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(h),e.autoClear===!1&&e.clear(),e.render(t,d),e.xr.enabled=a,e.shadowMap.autoUpdate=o,e.setRenderTarget(r);let s=n.viewport;s!==void 0&&e.state.viewport(s),i.visible=!0}this.onBeforeRender=function(e,t,n){n.userData.refractor!==!0&&g(n)&&(v(),x(n),y(n),S(e,t,n))},this.getRenderTarget=function(){return h},this.dispose=function(){h.dispose(),i.material.dispose()}}};rt.RefractorShader={name:`RefractorShader`,uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`

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

		}`};function it(e){let t=new P(3100,2850),r=new tt(t,{textureWidth:512,textureHeight:512,clipBias:.002,multisample:0}),i=new rt(t,{textureWidth:512,textureHeight:512,clipBias:.002,multisample:0}),a=[Je(),Je(2.7)],o=new n,s={...ye.clone(Fe.fog),reflectionMap:{value:r.getRenderTarget().texture},refractionMap:{value:i.getRenderTarget().texture},normalA:{value:a[0]},normalB:{value:a[1]},textureMatrix:{value:o},time:{value:0},tint:{value:new T(7050900)}},c=new Pe({name:`AincradLakeReflectionRefraction`,uniforms:s,fog:!0,vertexShader:`
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
      }`}),l=new F(t,c);l.name=`Aincrad alpine lake · reflected and refracted`,l.rotation.x=-Math.PI/2,l.position.set(0,-205,470),l.renderOrder=1,e.add(l),r.matrixAutoUpdate=i.matrixAutoUpdate=!1;let u=!0,d=!1,f=new _,p=new _;return l.onBeforeRender=(...e)=>{if(!u||d||e[1].overrideMaterial)return;let[n,a,s]=e;if(s.position.y<l.position.y)return;d=!0,n.getViewport(f),n.getScissor(p);let c=n.getScissorTest(),m=n.getRenderTarget(),h=l.visible;try{o.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),o.multiply(s.projectionMatrix).multiply(s.matrixWorldInverse).multiply(l.matrixWorld),l.visible=!1,r.matrixWorld.copy(l.matrixWorld),i.matrixWorld.copy(l.matrixWorld),n.setScissorTest(!1),r.onBeforeRender(n,a,s,t,r.material,e[5]),i.onBeforeRender(n,a,s,t,i.material,e[5])}finally{l.visible=h,n.setRenderTarget(m),n.setViewport(f),n.setScissor(p),n.setScissorTest(c),d=!1}},{mesh:l,update(e){s.time.value=e},setQuality(e,t){let n=e&&!t?768:384;r.getRenderTarget().setSize(n,n),i.getRenderTarget().setSize(n,n)},setEnabled(e){u=e,l.visible=e},dispose(){l.onBeforeRender=()=>{},e.remove(l),r.dispose(),i.dispose(),a.forEach(e=>e.dispose()),c.dispose(),t.dispose()}}}var at=Math.PI*2,ot=k.clamp,st=Array.from({length:19},(e,t)=>{let n=t/19*at,r=2750+q(t,21)*1450;return{x:Math.cos(n)*r,z:Math.sin(n)*r,height:520+q(t,74)*1350,width:450+q(t,28)*530}});function ct(e,t){let n=We(e/700+11,t/700+8),r=We(e/180-7,t/180+20),i=Math.hypot(e/1330,(t-440)/1310),a=k.smoothstep(i,.67,1.12),o=k.lerp(-86+r*19,-1+n*24+r*7,a);for(let n of st){let r=(e-n.x)/n.width,i=(t-n.z)/n.width,a=Math.atan2(i,r),s=Math.hypot(r*.83,i*1.12)*(1+Math.sin(a*5+n.x)*.19+Math.sin(a*11)*.08),c=Math.max(0,1-s/1.7);o+=n.height*c**2.4*(.48+We(e/160,t/160)*.98)}return o-180}function lt(e,t,n,r,i=!1){let a=new v(e,t,n);return a.castShadow=i,a.receiveShadow=!0,r.add(a),a}function ut(e,t,r,i,a,o=1,s=1,c=1,l=0,u=0){let d=new n().compose(new p(r,i,a),new H().setFromEuler(new ee(0,l,u)),new p(o,s,c));e.setMatrixAt(t,d)}function dt(e,t,n){let r=e.getAttribute(`uv`);for(let e=0;e<r.count;e++)r.setXY(e,r.getX(e)*t,r.getY(e)*n);return e}function ft(){let e=new Uint8Array(65536);for(let t=0;t<128;t++)for(let n=0;n<128;n++){let r=(n/128-.5)*2,i=(t/128-.5)*2,a=Math.max(0,1-r*r-i*i*1.6),o=We(n/26,t/26),s=ot((a*(.4+o)-.14)*1.85,0,1),c=206+ot(i*29+o*35,0,49),l=(t*128+n)*4;e[l]=c,e[l+1]=Math.min(255,c+4),e[l+2]=Math.min(255,c+8),e[l+3]=s*205}let t=new x(e,128,128,Se);return t.colorSpace=Me,t.magFilter=ie,t.minFilter=oe,t.generateMipmaps=!0,t.needsUpdate=!0,t}function pt(){let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`);t.fillStyle=`black`,t.fillRect(0,0,128,128),t.fillStyle=`white`;for(let e=0;e<17;e++){let n=20+q(e,71)*88,r=n+(q(e,75)-.5)*49,i=24+q(e,79)*103;t.beginPath(),t.moveTo(n-2,128),t.quadraticCurveTo(n-3,128-i*.62,r,128-i),t.quadraticCurveTo(n+3,128-i*.56,n+2,128),t.fill()}let n=new Ne(e);return n.anisotropy=4,n}function mt(e,t){let n=new M;n.name=`Aincrad · one hundred floating floors`,e.add(n);let r=new Set,i=new Set,a=qe();for(let t of[...e.children])(t instanceof ae||t.name===`Aincrad sun target`)&&e.remove(t);e.background=new T(10995668),e.fog=new h(10399671,6e-5);let o=new He;o.name=`Aincrad atmospheric scattering`,o.scale.setScalar(7e3);let s=new p(-.7,.53,.48).normalize(),c=new p(-.48,.78,.4).normalize(),l=o.material.uniforms;l.turbidity.value=2.6,l.rayleigh.value=2.1,l.mieCoefficient.value=.003,l.mieDirectionalG.value=.76,l.cloudCoverage.value=.58,l.cloudDensity.value=.55,l.sunPosition.value.copy(s);let u={turbidity:l.turbidity.value,rayleigh:l.rayleigh.value,mieCoefficient:l.mieCoefficient.value,mieDirectionalG:l.mieDirectionalG.value,cloudCoverage:l.cloudCoverage.value,cloudDensity:l.cloudDensity.value},g=e.background instanceof T?e.background.clone():new T(10995668),_=e.fog instanceof h?e.fog.color.clone():new T(10399671),b=e.fog instanceof h?e.fog.density:6e-5;o.material.fragmentShader=o.material.fragmentShader.replace(`gl_FragColor = vec4( texColor, 1.0 );`,`float skyLuminance = dot(texColor, vec3(0.2126, 0.7152, 0.0722));
     texColor *= 1.02 / (1.0 + skyLuminance);
     gl_FragColor = vec4(texColor, 1.0);`),n.add(o);let x=new de,S=o.clone();S.material=o.material.clone(),x.add(S);let C=new je(t),w=C.fromScene(x,.015,.1,1e4);C.dispose(),S.material.dispose(),e.environment=w.texture,e.environmentIntensity=.4;let E=new m(13230833,6772544,.48);n.add(E);let D=new f(16768432,3.55);D.name=`Aincrad near-camera sunlight`,D.castShadow=!0,D.shadow.mapSize.set(2048,2048),Object.assign(D.shadow.camera,{left:-56,right:56,top:56,bottom:-56,near:.5,far:520}),D.shadow.bias=-15e-6,D.shadow.normalBias=.018,D.shadow.radius=1.3,n.add(D),n.add(D.target);let O=D.intensity,ee=D.color.clone(),te=new f(11916519,.16);te.position.set(400,170,700),n.add(te);let ne=E.intensity,re=te.intensity;et(n,a);let ie=new P(9800,9800,280,280);ie.rotateX(-Math.PI/2);let oe=ie.getAttribute(`position`),N=new Float32Array(oe.count*3),ce=new T(7570782),le=new T(9606803),ue=new T(13951712),fe=new T;for(let e=0;e<oe.count;e++){let t=oe.getX(e),n=oe.getZ(e),r=ct(t,n),i=Math.min(t-640,1460-t,n-1140,1780-n);oe.setY(e,r-25*k.smoothstep(i,0,45));let a=Math.hypot(ct(t+18,n)-r,ct(t,n+18)-r)/18;fe.copy(ce).lerp(le,ot(a*.75+(r-210)/850,0,1)),fe.lerp(ue,k.smoothstep(r+We(t/130,n/130)*130,510,790)*ot(1.3-a*.42,0,1)),fe.multiplyScalar(.83+We(t/120,n/120)*.3),N[e*3]=fe.r,N[e*3+1]=fe.g,N[e*3+2]=fe.b}ie.setAttribute(`color`,new A(N,3)),ie.computeVertexNormals(),dt(ie,580,580);let pe=a.rock.clone();pe.color.set(16777215),pe.map=null,pe.vertexColors=!0,pe.normalScale.set(.3,.3),pe.onBeforeCompile=e=>{e.vertexShader=`varying vec3 alpineWorld;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
 alpineWorld = (modelMatrix * vec4(transformed,1.0)).xyz;`),e.fragmentShader=`varying vec3 alpineWorld;
      float alpineHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float alpineNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(alpineHash(i),alpineHash(i+vec3(1,0,0)),f.x),mix(alpineHash(i+vec3(0,1,0)),alpineHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(alpineHash(i+vec3(0,0,1)),alpineHash(i+vec3(1,0,1)),f.x),mix(alpineHash(i+vec3(0,1,1)),alpineHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      `+e.fragmentShader,e.fragmentShader=e.fragmentShader.replace(`#include <color_fragment>`,`#include <color_fragment>
      float strata=alpineNoise(alpineWorld*vec3(.09,.16,.09))*.45+alpineNoise(alpineWorld*.033)*.35+alpineNoise(alpineWorld*.42)*.2;
      diffuseColor.rgb *= .66+strata*.49;`),e.fragmentShader=e.fragmentShader.replace(`#include <opaque_fragment>`,`float alpineHaze = smoothstep(950.,5200.,distance(cameraPosition,alpineWorld))*.53*(.45+.55*smoothstep(-50.,400.,alpineWorld.y));
      outgoingLight=mix(outgoingLight,vec3(.38,.52,.62),alpineHaze);
      #include <opaque_fragment>`)},pe.customProgramCacheKey=()=>`alpine-strata-aerial-perspective-v2`,i.add(pe);let I=new F(ie,pe);I.name=`Alpine grasslands, rocky ridges and snow`,I.receiveShadow=!0,n.add(I);let me=new P(820,640,75,65);me.rotateX(-Math.PI/2),me.translate(1050,0,1460);let he=me.getAttribute(`position`);for(let e=0;e<he.count;e++)he.setY(e,ct(he.getX(e),he.getZ(e))+.15);me.computeVertexNormals(),dt(me,120,92);let ge=new F(me,a.grass);ge.name=`Aincrad local meadow backdrop · hidden in Floating City park`,ge.receiveShadow=!0,n.add(ge);let L=new P(1.25,1.1,1,3);L.translate(0,.55,0);let _e={value:0},ve=new R({color:6848329,roughness:1,side:2,alphaTest:.46}),ye=pt();r.add(ye),ve.alphaMap=ye,i.add(ve),ve.onBeforeCompile=e=>{e.uniforms.aincradWindTime=_e,e.vertexShader=`uniform float aincradWindTime;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
      vec3 bladeWorld = (instanceMatrix * vec4(position, 1.0)).xyz;
      transformed.x += sin(aincradWindTime * 1.35 + bladeWorld.x * 0.035 + bladeWorld.z * 0.06) * position.y * position.y * 0.23;
      transformed.z += cos(aincradWindTime * 0.85 + bladeWorld.z * 0.05) * position.y * 0.09;`)},ve.customProgramCacheKey=()=>`aincrad-grass-wind-v1`;let be=lt(L,ve,65e3,n);be.name=`Wind-swept foreground grasses`;for(let e=0;e<be.count;e++){let t=920+q(e,12)*310,n=1280+q(e,15)*320,r=.35+q(e,34)*.6;ut(be,e,t,ct(t,n)+.16,n,r,r,r,q(e,32)*at),be.setColorAt(e,new T().setHSL(.18+q(e,54)*.03,.22,.48+q(e,64)*.2))}let B=se(new y(1,3)),xe=B.getAttribute(`position`);for(let e=0;e<xe.count;e++){let t=.89+Math.sin(xe.getX(e)*5+xe.getY(e)*3)*Math.cos(xe.getZ(e)*4)*.12;xe.setXYZ(e,xe.getX(e)*t,xe.getY(e)*t,xe.getZ(e)*t)}B.computeVertexNormals();let Se=lt(B,a.rock,85,n,!0),Ce=lt(new z(.15,.3,1,6),a.bark,1500,n,!0),V=Ye();i.add(V.material),r.add(V.map);let H=lt(V.geometry,V.material,1500,n,!0);for(let e=0;e<1500;e++){let t=Math.floor(e/75),n=q(t,57)*at+(q(e,58)-.5)*.32,r=1620+q(t,59)*700+(q(e,61)-.5)*420,i=Math.sin(n)*r,a=Math.cos(n)*r,o=ct(i,a),s=i>850&&i<1320&&a>1200&&a<1660?.001:10+q(e,62)*18;ut(Ce,e,i,o+s*.22,a,s*.08,s*.44,s*.08),ut(H,e,i,o,a,s,s,s,n)}for(let e=0;e<Se.count;e++){let t=680+q(e,91)*880,n=1100+q(e,85)*720,r=.45+q(e,88)*5;ut(Se,e,t,ct(t,n)+r*.36,n,r*1.4,r*.75,r,q(e,39)*at)}let we=ft();r.add(we);let Te=new d({map:we,transparent:!0,opacity:.33,depthWrite:!1,fog:!0,color:15921381});i.add(Te);let Ee=[];for(let e=0;e<42;e++){let t=e/42*at,r=e>=22,i=r?1100+q(e,10)*1350:540+q(e,51)*310,a=new j(Te);a.position.set(Math.cos(t)*i,r?160+q(e,47)*280:-70+q(e,46)*110,Math.sin(t)*i);let o=r?620+q(e,76)*500:240+q(e,77)*200;a.scale.set(o,o*.38,1),n.add(a),Ee.push({sprite:a,origin:a.position.clone(),phase:t})}let De=it(e),Oe=nt(e,De.mesh),ke=!1,Ae=new p,Me=s.clone().multiplyScalar(175),Ne=!0,U=!1,W=!1,Pe=t.shadowMap.type;return{sun:D,materials:a,trackMaterial:a.path,update(e,t){_e.value=e,De.update(e),Oe.update(e);for(let{sprite:t,origin:n,phase:r}of Ee)t.position.x=n.x+Math.sin(e*.013+r)*12,t.position.y=n.y+Math.sin(e*.025+r*2)*3},prepareCamera(e){if(Oe.prepareCamera(e),e.getWorldPosition(Ae),W){let e=Math.hypot(Ae.x-K[0],Ae.z-K[2]);D.target.position.copy(Ae),D.position.copy(Ae).addScaledVector(c,220);let t=e<620?360:120,n=D.shadow.camera;n.left=n.bottom=-t,n.right=n.top=t,n.far=e<620?900:520,D.shadow.bias=-25e-6,n.updateProjectionMatrix(),D.target.updateMatrixWorld(),D.updateMatrixWorld();return}let t=e.name===`Aincrad cinematic camera`,n=t&&Ae.y>640,r=t||Math.hypot(Ae.x,Ae.z)>760,i=r?1-k.smoothstep(Ae.y,-30,160):0;r?(D.target.position.set(0,n?690:295,0).lerp(Ae,i),D.position.copy(D.target.position).addScaledVector(s,1650)):(D.position.copy(Ae).add(Me),D.target.position.copy(Ae));let a=r?k.lerp(n?240:680,65,i):34,o=D.shadow.camera;o.left=o.bottom=-a,o.right=o.top=a,o.far=r?3e3:360,D.shadow.bias=r?-45e-6:-15e-6,o.updateProjectionMatrix(),D.target.updateMatrixWorld(),D.updateMatrixWorld()},setQuality(e,n){Ne=e,U=n,De.setQuality(e,n),Oe.setQuality(e,n),be.visible=e&&!W;let r=e?W&&!n?3072:2048:1024;t.shadowMap.type=W?2:Pe,D.shadow.mapSize.set(r,r),D.shadow.radius=W?n?1.8:1.55:1.3,D.shadow.normalBias=W?.012:.018,D.shadow.map&&(D.shadow.map.dispose(),D.shadow.map=null)},setFloatingParkMode(n){W=n,be.visible=Ne&&!n,Se.visible=Ce.visible=H.visible=!n,ge.visible=!n,D.shadow.mapSize.set(Ne?n&&!U?3072:2048:1024,Ne?n&&!U?3072:2048:1024),t.shadowMap.type=n?2:Pe,D.shadow.radius=n?1.55:1.3,D.shadow.normalBias=n?.012:.018,D.shadow.map&&(D.shadow.map.dispose(),D.shadow.map=null),D.intensity=n?2.95:O,D.color.set(n?16766381:ee),E.intensity=n?.34:ne,te.intensity=n?.1:re,e.environmentIntensity=n?.44:.4,e.fog instanceof h&&(e.fog.color.copy(n?new T(9023154):_),e.fog.density=n?42e-6:b),e.background instanceof T&&e.background.copy(n?new T(10405327):g),l.turbidity.value=n?2.25:u.turbidity,l.rayleigh.value=n?2.6:u.rayleigh,l.mieCoefficient.value=n?.002:u.mieCoefficient,l.mieDirectionalG.value=n?.78:u.mieDirectionalG,l.cloudCoverage.value=n?.62:u.cloudCoverage,l.cloudDensity.value=n?.58:u.cloudDensity},setWaterEnabled(e){De.setEnabled(e),Oe.setEnabled(e)},dispose(){if(ke)return;ke=!0,Oe.dispose(),De.dispose(),w.dispose(),e.environment=null;let t=new Set;n.traverse(e=>{if(e instanceof F){t.add(e.geometry),e instanceof v&&e.dispose();for(let t of Array.isArray(e.material)?e.material:[e.material])i.add(t)}}),D.shadow.dispose(),t.forEach(e=>e.dispose()),i.forEach(e=>e.dispose()),r.forEach(e=>e.dispose()),a.dispose(),n.removeFromParent(),n.clear()}}}var ht=class extends ve{segment;variant;phase=`warning`;heading;frame;warning;wasRolling=!1;cycle=-1;localTime=0;constructor(t,r,i,a,o,s=o){let l=Le[i].clone().lerp(Le[i+1],.55),u=new y(1.05,2),d=u.getAttribute(`position`);for(let e=0;e<d.count;e++){let t=d.getX(e),n=d.getY(e),r=d.getZ(e),i=1+Math.sin(t*9+r*7)*Math.cos(n*8)*.025;d.setXYZ(e,t*i,n*i,r*i)}u.computeVertexNormals(),super(t,r,{kind:`roller`,p:l.toArray(),size:[2.1,2.1,2.1],surface:`stone`},!0,!1,u,e.ColliderDesc.ball(1.05)),this.segment=i,this.variant=a,this.visual.material.dispose(),this.visual.material=s,this.visual.name=`Crossing boulder`,this.visual.castShadow=this.visual.receiveShadow=!0;let f=Le[i+1].clone().sub(Le[i]).normalize();this.heading=new p(0,1,0).cross(f).normalize();let m=f.clone().cross(this.heading).normalize();this.frame=new H().setFromRotationMatrix(new n().makeBasis(this.heading,m,f)),this.warning=new F(new P(9.4,.6),new Oe({color:16759892,transparent:!0,opacity:.48,depthWrite:!1})),this.warning.rotation.x=-Math.PI/2,this.warning.quaternion.premultiply(this.frame),this.warning.position.copy(l).addScaledVector(m,.055),r.add(this.warning),this.collider.setEnabled(!1);for(let e of[-1,1]){let t=new F(new W(1.6,2.6,3.2),o);t.quaternion.copy(this.frame),t.position.copy(l).add(new p(e*6.3,1.3,0).applyQuaternion(this.frame)),t.castShadow=t.receiveShadow=!0,r.add(t);let n=new F(new W(1.8,.28,3.6),new R({color:10060891,metalness:.55,roughness:.55}));n.quaternion.copy(this.frame),n.position.copy(t.position).addScaledVector(m,1.4),r.add(n);let i=this.frame.clone().multiply(new H().setFromAxisAngle(new p(0,1,0),-e*Math.PI/2)),a=new p(e*5.47,1.15,0).applyQuaternion(this.frame).add(l),s=new F(new c(1.11,32),new Oe({color:1515556}));s.quaternion.copy(i),s.position.copy(a),r.add(s);let u=new F(new B(1.2,.16,8,32),o);u.quaternion.copy(i),u.position.copy(a).addScaledVector(this.heading,-e*.045),u.castShadow=!0,r.add(u)}}update(e,t,n){let r=12+this.variant%3,i=(e+this.variant*2.3)%r,a=Math.floor((e+this.variant*2.3)/r),o=i>=1.65&&i<5.7;this.phase=i<1.65?`warning`:o?`rolling`:`rest`,this.localTime=i,this.warning.visible=i<5.7,this.warning.material.opacity=o?.16:.26+Math.sin(i*12)*.16,this.visual.visible=o||i<1.65;let s=(this.variant+a)%2==0?1:-1,c=k.clamp((i-1.65)/4.05,0,1),l=new p(s*(6.7-13.4*c),1.1,0).applyQuaternion(this.frame).add(this.origin);(!o||!this.wasRolling||a!==this.cycle)&&(this.body.setTranslation(l,!0),this.previous.copy(l),this.velocity.set(0,0,0)),this.collider.setEnabled(o),o&&this.move(l,t),this.wasRolling=o,this.cycle=a}sync(){super.sync(),this.visual.quaternion.copy(this.frame).multiply(new H().setFromAxisAngle(new p(0,0,1),this.localTime*3))}impact(e){if(this.phase===`rolling`){for(let t of e)if(t.active&&t.machine.invincible<=0&&this.contact(t)){t.impact=8.5;let e=t.current.clone().sub(this.visual.position).setY(.5).normalize().multiplyScalar(3.2);t.body.applyImpulse(e,!0)}}}},gt=class extends ve{segment;variant;phase=`warning`;heading;frame;warning;localTime=0;constructor(e,t,r,i,a){let o=Le[r].clone().lerp(Le[r+1],.5);super(e,t,{kind:`pusher`,p:o.toArray(),size:[5.6,1.15,.9],color:10978897,surface:`stone`},!0),this.segment=r,this.variant=i,this.visual.material.dispose(),this.visual.material=a,this.visual.name=`Aincrad brass deck sweeper`;let s=Le[r+1].clone().sub(Le[r]).normalize();this.heading=new p(0,1,0).cross(s).normalize();let c=s.clone().cross(this.heading).normalize();this.frame=new H().setFromRotationMatrix(new n().makeBasis(this.heading,c,s)),this.body.setRotation(this.frame,!0),this.visual.quaternion.copy(this.frame),this.warning=new F(new P(9.2,.45),new Oe({color:16766061,transparent:!0,opacity:.38,depthWrite:!1})),this.warning.rotation.x=-Math.PI/2,this.warning.quaternion.premultiply(this.frame),this.warning.position.copy(o).addScaledVector(c,.06),t.add(this.warning),this.collider.setEnabled(!1)}update(e,t,n){let r=10.5+this.variant%3*.7,i=(e+this.variant*1.8)%r;this.localTime=i,this.phase=i<1.35?`warning`:i<4.85?`active`:`rest`;let a=this.phase===`active`;this.warning.visible=i<4.85,this.warning.material.opacity=a?.13:.28+Math.sin(i*10)*.12;let o=k.clamp((i-1.35)/3.5,0,1),s=Math.sin(o*Math.PI)*6.4-3.2,c=this.origin.clone().addScaledVector(this.heading,s);a?this.move(c,t):(this.body.setTranslation(this.origin,!0),this.previous.copy(this.origin),this.velocity.set(0,0,0)),this.collider.setEnabled(a),this.visual.visible=i<4.85}sync(){super.sync(),this.visual.quaternion.copy(this.frame).multiply(new H().setFromAxisAngle(new p(0,0,1),this.localTime*1.8))}};function _t(e,t,n,r){let i=n.clone();i.color.set(8420716),i.roughness=.91,i.normalScale.set(.9,.9);let a=r.clone();a.color.set(9143670),a.roughness=.96,a.normalScale.set(1.2,1.2);let o=Array.from({length:36},(n,r)=>{let o=[3,15,29,47,67,83];return new ht(e,t,Math.floor(r/o.length)*96+o[r%o.length],r,i,a)}),s=Array.from({length:12},(n,r)=>{let a=[41,69];return new gt(e,t,Math.floor(r/a.length)*96+a[r%a.length],r,i)});return[...o,...s]}function vt(e,t){let r=new $e(e),i=new W(1,1,1),a=Qe(!0),o=t.clone();o.color.set(13024162),o.roughness=.87;let s=new R({color:8547653,metalness:.72,roughness:.4}),l=new R({color:3626580,metalness:.58,roughness:.62}),u=new R({color:3296860,side:2,roughness:1}),d=new P(1.2,3.5,6,14),f=d.getAttribute(`position`);for(let e=0;e<f.count;e++){let t=f.getY(e);f.setZ(e,Math.sin(t*3+f.getX(e)*3)*.12*(1.75-t)/3.5)}d.computeVertexNormals();let m=new U(1,12,8),h=new Te({color:5002575,roughness:.17,metalness:.12,clearcoat:1,clearcoatRoughness:.1,transparent:!0,opacity:.28,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-1}),g=new c(1,24),_=g.getAttribute(`position`);for(let e=1;e<_.count;e++){let t=1+Math.sin(e*2.8)*.1;_.setXY(e,_.getX(e)*t,_.getY(e)*t)}let v=(e,t,n)=>new p(e,t,n);for(let e=0;e<Le.length-1;e++){let t=Le[e],c=Le[e+1].clone().sub(t).normalize(),f=v(0,1,0).cross(c).normalize(),p=c.clone().cross(f).normalize(),_=new H().setFromRotationMatrix(new n().makeBasis(f,p,c)),y=e=>e.applyQuaternion(_).add(t),b=(e,t,n,i,a,o=_)=>r.add(e,t,n,y(i),a,o),x=e%96>=44&&e%96<=50;if(e%2==0)for(let e of[-1,1]){b(`Bridge corbels`,i,o,v(e*4.5,-2.6,0),v(.9,4.4,1.4));let t=_.clone().multiply(new H().setFromAxisAngle(v(0,0,1),.9));b(`Stone cantilever braces`,i,o,v(16,-10.5,e*1.5),v(1.5,31,1.8),t),b(`Bracket ornamental bosses`,m,s,v(e*4.5,-1.3,-.76),v(.23,.23,.15))}if(!x&&e%4==0){for(let e of[-1,1])b(`Gothic gateway piers`,i,o,v(e*5.85,3.3,0),v(1.35,6.6,1.6)),b(`Gateway stepped bases`,i,o,v(e*5.85,.3,0),v(1.9,.6,2.2)),b(`Gateway capitals`,i,o,v(e*5.85,6.2,0),v(1.9,.4,2.2)),b(`Route ceremonial banners`,d,u,v(e*6.05,3.8,1.03),v(1,1,1)),b(`Banner gilded arms`,i,s,v(e*6.05,5.6,1.05),v(1.6,.085,.12));b(`Open gothic bridge archways`,a,o,v(0,0,-.45),v(13.2,10.7,5)),b(`Arch bronze outer relief`,a,l,v(0,.12,.55),v(13.3,10.8,.65)),b(`Arch keystone medallions`,m,s,v(0,10.05,1.15),v(.48,.7,.15))}if(!x&&![7,23,39,71,87].includes(e%96)){let t=_.clone().multiply(new H().setFromAxisAngle(v(1,0,0),-Math.PI/2));b(`Scattered wet flagstone patches`,g,h,v(e%2?2:-1,.028,8),v(1.1,2.2,1),t)}if([7,23,39,71,87].includes(e%96)){let n=t.distanceTo(Le[e+1]);for(let e of[-2.1,2.1])for(let t of[-1,1])b(`Broken bridge warning inlays`,i,s,v(t*3.5,.06,n/2+e),v(1.2,.04,.22))}}r.finish()}function yt(e){if(e.userData.aincradMetricUV)return;e.userData.aincradMetricUV=!0;let t=e.onBeforeCompile,n=e.customProgramCacheKey.bind(e)();e.onBeforeCompile=(n,r)=>{t.call(e,n,r),n.vertexShader=n.vertexShader.replace(`#include <common>`,`#include <common>
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
      #endif`)},e.customProgramCacheKey=()=>`${n}|aincrad-metric-stone-v1`,e.needsUpdate=!0}function bt(e){let t=``;for(let[n,r]of[[100,`C`],[90,`XC`],[50,`L`],[40,`XL`],[10,`X`],[9,`IX`],[5,`V`],[4,`IV`],[1,`I`]])for(;e>=n;)t+=r,e-=n;return t}function xt(r,i,a,o=a){let s=new M;s.name=`Aincrad exterior spiral course`,s.userData.turns=Re.turns,s.userData.routeSegments=Ve,i.add(s),vt(s,a);let c=new W(1,1,1);yt(a);let l=new R({color:4743006,metalness:.68,roughness:.52}),u=new R({color:11650237,metalness:.62,roughness:.42}),d=new R({color:16768672,emissive:16757583,emissiveIntensity:1.3,roughness:.28}),f=new Map;for(let[e,t]of[[a,`Instanced stone deck and balustrades`],[l,`Instanced patinated lantern frames`],[u,`Instanced silver route inlays`],[d,`Instanced lantern glass`]])f.set(e,{material:e,name:t,matrices:[],sizes:[],colors:[]});let m=new n,h=new p,g=new p,_=new H,y=new H,b=new H,x=new T(1,1,1),S=(e,t,n,r=b,i=x)=>{let a=f.get(e);g.set(...n),a.matrices.push(m.compose(t,r,g).clone()),a.sizes.push(...n),a.colors.push(i.clone())},C=(e,t,n,r,i,a)=>{h.set(...r).applyQuaternion(n).add(t),y.copy(n),a&&y.multiply(a),S(e,h,i,y)},w=(n,i,a=b)=>r.createCollider(e.ColliderDesc.cuboid(i[0]/2,i[1]/2,i[2]/2).setTranslation(n.x,n.y,n.z).setRotation(a).setFriction(.65).setCollisionGroups(t.terrain)),E=ze.obstacles.map(e=>{let t=ce(r,i,{...e,surface:`stone`});i.remove(t.visual),t.visual.geometry.dispose();for(let e of Array.isArray(t.visual.material)?t.visual.material:[t.visual.material])e.dispose();t.visual.geometry=c,t.visual.material=a,t.visual.scale.copy(t.size),t.visual.name=`Detached static obstacle reference`,_.copy(t.body.rotation());let n=t.size,o=n.y<.9;if(S(a,t.origin,[n.x,n.y,n.z],_,o?new T(.65,.72,.69):x),o||n.x>20)return t;let s=n.x<6,l=Math.max(.2,n.z-.16);for(let e of[-1,1]){let r=e*(n.x/2-.15);C(a,t.origin,_,[r,n.y/2+.095,0],[.3,.19,l]);let i=[.3,s?.19:1.08,l];if(h.set(r,n.y/2+i[1]/2,0).applyQuaternion(_).add(t.origin),w(h,i,_),s)continue;C(a,t.origin,_,[r,n.y/2+1.04,0],[.4,.2,l]);let o=Math.max(2,Math.ceil(l/3.4));for(let e=0;e<o;e++){let i=k.lerp(-l/2+.24,l/2-.24,e/(o-1));C(a,t.origin,_,[r,n.y/2+.53,i],[.21,.88,.21]),C(a,t.origin,_,[r,n.y/2+.2,i],[.38,.19,.38])}}return t}),D=new p(0,1,0),O=new p,ee=new p,A=new p,te=new n,ne={I:[[0,-.35,0,.35]],V:[[-.2,.35,0,-.35],[0,-.35,.2,.35]],X:[[-.2,-.35,.2,.35],[-.2,.35,.2,-.35]],L:[[-.2,.35,-.2,-.35],[-.2,-.35,.2,-.35]],C:[[.2,.35,-.2,.35],[-.2,.35,-.2,-.35],[-.2,-.35,.2,-.35]]};for(let e=0;e<Le.length-1;e+=8){let t=Le[e];O.subVectors(Le[e+1],t).normalize(),ee.crossVectors(D,O).normalize();let n=O.clone().cross(ee).normalize();_.setFromRotationMatrix(te.makeBasis(ee,n,O));let r=e%Re.segmentsPerTurn,i=r>=44&&r<=50?2.3:Re.width/2;A.set(t.x,0,t.z).normalize();let o=t.clone().addScaledVector(A,i-.24),s=new H().setFromAxisAngle(D,Math.atan2(-A.x,-A.z));S(a,o.clone().add(new p(0,.25,0)),[.72,.5,.72],s),S(l,o.clone().add(new p(0,1.3,0)),[.14,2.1,.14],s),S(l,o.clone().add(new p(0,2.33,0)),[.7,.12,.7],s),S(d,o.clone().add(new p(0,2.72,0)),[.43,.64,.43],s);for(let e of[-.27,.27])for(let t of[-.27,.27])C(l,o,s,[e,2.72,t],[.055,.79,.055]);if(S(l,o.clone().add(new p(0,3.11,0)),[.72,.13,.72],s),w(o.clone().add(new p(0,1.2,0)),[.45,2.4,.45],s),e%16==0){let t=bt(Math.max(1,Math.round(e/Ve*100)));C(l,o,s,[0,1.75,.24],[Math.max(.95,t.length*.32+.2),.76,.1]);let n=.65;for(let e=0;e<t.length;e++)for(let[r,i,a,c]of ne[t[e]]){let l=a-r,d=c-i,f=new H().setFromAxisAngle(new p(0,0,1),-Math.atan2(l,d));C(u,o,s,[(e-(t.length-1)/2)*.32+(r+a)*n/2,1.75+(i+c)*n/2,.302],[.035,Math.hypot(l,d)*n,.012],f)}}if(e>0)for(let e of[-1,1]){let n=new H().setFromAxisAngle(D,e*.62);C(u,t,_,[e*.22,.021,1.4],[.085,.018,.85],n)}}for(let e of f.values()){let t=e.material===a?c:c.clone();t.setAttribute(`courseScale`,new we(new Float32Array(e.sizes),3));let n=new v(t,e.material,e.matrices.length);n.name=e.name,n.castShadow=e.material!==d,n.receiveShadow=!0;for(let t=0;t<e.matrices.length;t++)n.setMatrixAt(t,e.matrices[t]),n.setColorAt(t,e.colors[t]);n.instanceMatrix.needsUpdate=!0,n.instanceColor&&(n.instanceColor.needsUpdate=!0),n.computeBoundingSphere(),s.add(n)}let[j,re,ie]=ze.finish,ae=new M;ae.name=`Summit silver and teal crystal altar`,ae.position.set(j,re-1,ie),s.add(ae);let oe=new R({color:8096130,roughness:.93}),se=new F(new z(2.7,2.9,.18,48),oe);se.position.y=.09,se.receiveShadow=!0,ae.add(se),r.createCollider(e.ColliderDesc.cylinder(.09,2.8).setTranslation(j,re-.91,ie).setCollisionGroups(t.terrain));for(let e of[1.65,2.6]){let t=new F(new B(e,.035,6,64),u);t.rotation.x=Math.PI/2,t.position.y=.2,ae.add(t)}let N=new M;N.name=`Aincrad summit crystal victory sensor`,N.position.set(j,re,ie),i.add(N);let le=new Te({color:9096132,roughness:.13,metalness:.08,clearcoat:1,clearcoatRoughness:.09,emissive:2052430,emissiveIntensity:.22}),ue=new F(new V(.7),le);ue.scale.set(.82,1.45,.82),ue.castShadow=!0,N.add(ue);let de=new F(new B(1.05,.035,6,64),u);de.rotation.x=Math.PI/2+.25,N.add(de);let fe=new me(9360583,3,10,2);fe.position.y=1,N.add(fe);let pe=r.createCollider(e.ColliderDesc.ball(1).setTranslation(...ze.finish).setSensor(!0).setCollisionGroups(t.trigger));return{obstacles:[...E,..._t(r,i,a,o)],crown:{root:N,collider:pe}}}var St=Math.PI*2;function Ct(e,t){return e.geometries.add(t),t}function wt(e,t){return e.materials.add(t),t}function Tt(e,t,n,r={}){let i=e.clone();return i.color.set(n),r.roughness!==void 0&&(i.roughness=r.roughness),r.metalness!==void 0&&(i.metalness=r.metalness),wt(t,i)}function Et(e,t,n){e.onBeforeCompile=e=>{e.uniforms.floatingSurfaceSeed={value:n},e.vertexShader=`varying vec3 floatingSurfaceWorld;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
 floatingSurfaceWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`),e.fragmentShader=`varying vec3 floatingSurfaceWorld;
       uniform float floatingSurfaceSeed;
       float floatingSurfaceNoise(vec3 p){
         vec3 cell=floor(p);
         return fract(sin(dot(cell,vec3(127.1,311.7,74.7)) + floatingSurfaceSeed) * 43758.5453);
       }
      `+e.fragmentShader;let r=t===`wood`?`float grain=0.5+0.5*sin(floatingSurfaceWorld.z*1.7+floatingSurfaceWorld.x*0.23+micro*5.0);
           diffuseColor.rgb *= 0.78 + grain*0.18 + micro*0.12;`:t===`metal`?`float brushed=0.5+0.5*sin(floatingSurfaceWorld.x*3.2+floatingSurfaceWorld.z*0.42+micro*8.0);
             diffuseColor.rgb *= 0.91 + brushed*0.1;`:t===`interior`?`float panel=0.5+0.5*sin(floatingSurfaceWorld.y*2.35+floatingSurfaceWorld.x*0.18+micro*4.0);
               diffuseColor.rgb *= 0.78 + panel*0.12 + micro*0.16;`:`float block=0.5+0.5*sin(floatingSurfaceWorld.y*1.45+floor(floatingSurfaceWorld.x*0.32)*0.71+micro*3.0);
               float wear=smoothstep(0.18,0.82,fine);
               diffuseColor.rgb *= 0.78 + block*0.16 + wear*0.13;`,i=t===`wood`?`roughnessFactor = clamp(roughnessFactor + 0.08 + (0.5-(0.5+0.5*sin(floatingSurfaceWorld.z*1.7+floatingSurfaceWorld.x*0.23+micro*5.0)))*0.1, 0.18, 1.0);`:t===`metal`?`roughnessFactor = clamp(roughnessFactor + 0.035 + micro*0.035, 0.12, 1.0);`:t===`interior`?`roughnessFactor = clamp(roughnessFactor + 0.06 + micro*0.06, 0.16, 1.0);`:`float blockRoughness=0.5+0.5*sin(floatingSurfaceWorld.y*1.45+floor(floatingSurfaceWorld.x*0.32)*0.71+micro*3.0);
               roughnessFactor = clamp(roughnessFactor + 0.07 + (0.5-blockRoughness)*0.12, 0.2, 1.0);`;e.fragmentShader=e.fragmentShader.replace(`#include <color_fragment>`,`#include <color_fragment>
       vec3 floatingSurfacePoint=floatingSurfaceWorld*vec3(0.21,0.17,0.21);
       float micro=floatingSurfaceNoise(floatingSurfacePoint);
       float fine=floatingSurfaceNoise(floatingSurfaceWorld*vec3(1.45,1.1,1.45)+vec3(floatingSurfaceSeed));
       ${r}`),e.fragmentShader=e.fragmentShader.replace(`#include <roughnessmap_fragment>`,`#include <roughnessmap_fragment>
       ${i}`)},e.customProgramCacheKey=()=>`floating-surface-detail-${t}`}function Dt(e,t,n){let r=e.zone===`water`?9087402:e.zone===`jungle`?10267011:e.zone===`volcanic`?6052956:e.zone===`mechanical`?9800310:e.zone===`castle`?11578780:11575427,i=e.zone===`volcanic`?8212293:13681824,a=e.zone===`volcanic`?3157813:e.zone===`water`?6322042:5792862,o=e.zone===`jungle`?7754811:e.zone===`water`?6310199:7229495,s=wt(n,new Te({color:13233890,map:t.window.map,emissiveMap:t.window.emissiveMap,roughness:.14,metalness:.24,clearcoat:.72,clearcoatRoughness:.09,transmission:.08,thickness:.08,side:2}));s.emissive.set(e.color),s.emissiveIntensity=e.zone===`volcanic`?.72:.44,s.transparent=!0,s.opacity=.88;let c=wt(n,new R({color:e.color,emissive:e.color,emissiveIntensity:2.3,roughness:.2,metalness:.18})),l=wt(n,new Te({color:e.zone===`volcanic`?12406320:3058611,roughness:.1,metalness:.04,transmission:.18,clearcoat:.9,clearcoatRoughness:.08,transparent:!0,opacity:.78})),u=Tt(t.limestone,n,r,{roughness:.82}),d=Tt(t.stone,n,i,{roughness:.76}),f=Tt(t.rock,n,a,{roughness:.94}),p=Tt(t.rock,n,2179401,{roughness:.52,metalness:.24}),m=wt(n,new R({color:e.zone===`water`?1526610:e.zone===`volcanic`?3284778:2439230,map:t.rock.map,normalMap:t.rock.normalMap,roughnessMap:t.rock.roughnessMap,normalScale:new O(.42,.42),emissive:e.color,emissiveIntensity:e.zone===`volcanic`?.22:.12,roughness:.46,metalness:.18})),h=Tt(t.bark,n,o,{roughness:.9}),g=Tt(t.bronze,n,3427915,{roughness:.42,metalness:.76}),_=Tt(t.gold,n,e.color,{roughness:.32,metalness:.72}),v=e.color%997;return Et(u,`stone`,v+.1),Et(d,`stone`,v+.2),Et(f,`stone`,v+.3),Et(p,`interior`,v+.4),Et(m,`interior`,v+.5),Et(h,`wood`,v+.6),Et(g,`metal`,v+.7),Et(_,`metal`,v+.8),{stone:u,stoneLight:d,rock:f,dark:p,interior:m,wood:h,metal:g,trim:_,window:s,glow:c,foliage:Tt(t.foliage,n,5078093,{roughness:1}),water:l}}function J(e,t,n,r,i,a,o){let s=I(e,Ct(t,n),r,i,a);return o&&s.rotation.set(...o),s}function Y(e,t,n,r,i,a=.16,o){return J(e,t,L(...r,a),n,i,void 0,o)}function X(e,t,n,r,i,a,o=12,s,c){return J(e,t,new z(r,r*1.06,i,o),n,a,s,c)}function Ot(e,t,n,r,i,a,o=3.1,s=2.15,c=!1){let l=Y(e,t,n.window,c?[.16,s,o]:[o,s,.16],[r,i,a],.08);c&&(l.rotation.y=Math.PI/2);let u=n.trim;if(c){let n=[0,Math.PI/2,0];Y(e,t,u,[.22,.2,o+.38],[r,i-s*.5-.1,a],.04,n),Y(e,t,u,[.22,.2,o+.38],[r,i+s*.5+.1,a],.04,n),Y(e,t,u,[.22,s+.38,.2],[r-o*.5-.1,i,a],.04,n),Y(e,t,u,[.22,s+.38,.2],[r+o*.5+.1,i,a],.04,n)}else Y(e,t,u,[o+.38,.2,.22],[r,i-s*.5-.1,a],.04),Y(e,t,u,[o+.38,.2,.22],[r,i+s*.5+.1,a],.04),Y(e,t,u,[.2,s+.38,.22],[r-o*.5-.1,i,a],.04),Y(e,t,u,[.2,s+.38,.22],[r+o*.5+.1,i,a],.04);let d=c?Y(e,t,n.metal,[.27,s,.12],[r,i,a],.03,[0,Math.PI/2,0]):Y(e,t,n.metal,[.12,s,.27],[r,i,a],.03);return c&&(d.rotation.y=Math.PI/2),l}function kt(e,t,n,r,i){let a=X(e,t,n.glow,.28,.72,r,12);if(!e.userData.venueLight){let t=new me(i,1.7,26,2);t.position.set(...r),t.castShadow=!1,e.userData.venueLight=t,e.add(t)}return a}function At(e,t,n,r,i,a=2.5,o=0){X(e,t,n.wood,.22,a,[r,a/2+.2,i],8,[1,1,1],[.02,o,0]);for(let s=0;s<3;s++){let c=J(e,t,new y(1,1),n.foliage,[r+Math.sin(o+s*2.1)*1.1,a+.3+s*.42,i+Math.cos(o+s)*.7],[1.15+s*.12,.75+s*.16,1.15+s*.12],[0,o+s,0]);c.castShadow=!0}}function Z(e,t,n,r,i,a,o,s,c=.42){let l=Math.sqrt((i*.52)**2+(a*.5)**2);for(let n of[-1,1])Y(e,t,r,[l,.55,a],[n*i*.24,o,s],.12,[0,0,n*c]);Y(e,t,n.trim,[i*.94,.28,a+.26],[0,o-.04,s],.06)}function jt(e,t,n,i){Y(e,t,n.dark,[14.8,.24,10.2],[0,1.45,2.1],.06),Y(e,t,n.interior,[12.9,.12,8.2],[0,1.62,2],.04),Y(e,t,n.stoneLight,[13.8,.16,1.05],[0,1.63,-1.45],.04);for(let r of[-4.8,-2.4,0,2.4,4.8])Y(e,t,n.trim,[.12,.07,8.2],[r,1.75,2.35],.02);Y(e,t,n.dark,[13.8,.22,9.3],[0,9,2.1],.06),Y(e,t,n.stone,[14.6,6.4,.28],[0,4.55,7.05],.06),Y(e,t,n.interior,[7.8,4.8,.2],[0,4.65,6.86],.05),Y(e,t,n.window,[5.8,1.05,.12],[0,6.85,6.69],.04),Y(e,t,n.trim,[6.15,.12,.2],[0,7.42,6.61],.03);for(let r of[-2.65,2.65])Y(e,t,n.window,[1.7,2,.14],[r,4.95,6.7],.04),Y(e,t,n.trim,[1.95,.14,.2],[r,6.02,6.64],.03);Ot(e,t,n,-4.1,5.55,6.82,2.3,1.55),Ot(e,t,n,4.1,5.55,6.82,2.3,1.55);let a=e.userData.venueLight;a&&(a.position.set(0,5.6,3.1),a.intensity=2.2,a.distance=30);for(let r of[-7.1,7.1])Y(e,t,n.stoneLight,[.62,6.4,.62],[r,4.55,1.5],.08),Y(e,t,n.trim,[.22,6.1,.72],[r,4.55,1.1],.04);for(let r of[-1,1])Y(e,t,n.wood,[2.8,.42,.72],[r*4.9,2.35,2.2],.06),Y(e,t,n.trim,[2.95,.16,.14],[r*4.9,2.62,2.2],.03),Y(e,t,n.wood,[.24,1,.24],[r*4.9,2,1.82],.03);Y(e,t,n.wood,[7.6,.68,1.15],[0,2.45,.15],.07),Y(e,t,n.trim,[6.8,.12,.18],[0,2.82,-.43],.03),Y(e,t,n.window,[3.8,.72,.08],[0,2.98,-.46],.02);for(let r of[-4.3,4.3])X(e,t,n.metal,.11,2.6,[r,2.82,.7],10),X(e,t,n.trim,.24,.12,[r,4.14,.7],10);for(let r=0;r<4;r++)Y(e,t,n.stoneLight,[8.8+r*1.6,.25,.7],[0,1.62+r*.24,-2.8+r*.82],.05);for(let r of[-5.1,5.1])kt(e,t,n,[r,5.8,.2],n.glow.color.getHex()),Y(e,t,n.trim,[.18,3.1,.18],[r,7.05,2.2],.03);for(let r of[-3,0,3])kt(e,t,n,[r,6.9,2.9],n.glow.color.getHex());for(let r of[-4.2,0,4.2])Y(e,t,n.metal,[.24,.24,10.6],[r,8.74,2.05],.03);switch(i){case`gate`:case`maze`:for(let r of[-3.2,-1.6,0,1.6,3.2])Y(e,t,n.trim,[.26,4.2,.38],[r,3.8,4.7],.03);Y(e,t,n.metal,[8,.28,.45],[0,5.9,4.7],.03);break;case`waterfall`:case`water`:case`canal`:Y(e,t,n.stoneLight,[10.6,.55,.9],[0,2.2,4.5],.08),Y(e,t,n.water,[4.3,.12,.55],[0,2.55,4],.06);for(let r of[-4.2,4.2])X(e,t,n.water,.22,4.4,[r,4,4.4],10);break;case`boulder`:for(let r of[-4.1,0,4.1])J(e,t,new g(1.15,1),n.rock,[r,2.65,4.6],[1.3,1,1.1]);Y(e,t,n.wood,[11.2,.55,.55],[0,5.8,4.6],.08);break;case`bridge`:case`vine`:for(let r of[-1,1])Y(e,t,n.wood,[.46,4.8,.46],[r*4.6,4,4.5],.06),Y(e,t,n.wood,[9.8,.28,.32],[0,6.1,4.5],.05);for(let r of[-3.4,-1.7,0,1.7,3.4])Y(e,t,n.wood,[1.2,.22,2.8],[r,2,4.5],.04,[0,0,Math.sin(r)*.12]);break;case`temple`:case`statue`:for(let r of[-4.5,4.5])X(e,t,n.stoneLight,.68,4.8,[r,4,4.7],14),X(e,t,n.trim,.86,.22,[r,6.48,4.7],14);Y(e,t,n.trim,[10.2,.42,.65],[0,6.8,4.7],.06),J(e,t,new V(1,1),n.glow,[0,4,4.4],[1.15,1.4,.68]);break;case`volcano`:for(let i of[-3.8,3.8])J(e,t,new r(1.35,4.4,8),n.rock,[i,3.5,4.4],[1,1,1]),X(e,t,n.glow,.62,.16,[i,5.78,4.4],16);Y(e,t,n.glow,[.32,.2,5.2],[0,2,4.4],.03,[.06,0,0]);break;case`mine`:case`construction`:for(let r of[-1,1])Y(e,t,n.metal,[.34,5.2,.34],[r*5.1,4.1,4.5],.04),Y(e,t,n.trim,[.25,.25,10.5],[r*5.1,6.35,2.3],.03);Y(e,t,n.metal,[10.8,.3,.3],[0,6.35,4.5],.03),kt(e,t,n,[0,6,4.2],16758875);break;case`tree`:X(e,t,n.wood,1.15,6.2,[0,4,4.3],14,[1,1,1.25]);for(let r of[-1,1])Y(e,t,n.wood,[4.6,.46,.54],[r*2.3,2.4,4.2],.08,[0,r*.12,r*.2]);J(e,t,new y(2.3,1),n.foliage,[0,7.2,4.4],[1.5,.7,1.2]);break;case`observatory`:X(e,t,n.metal,2,.26,[0,2,4.6],24),X(e,t,n.trim,.22,5.2,[0,4.6,4.6],10,void 0,[.1,0,-.25]),J(e,t,new U(1.15,16,10),n.window,[0,6.2,4.6],[1.1,.36,1.1]);break;case`cave`:J(e,t,new B(3,.48,10,28,Math.PI),n.rock,[0,4.2,4.5],[1.2,1.1,1]),Y(e,t,n.dark,[5.8,4,.28],[0,3,4.55],.05);for(let i of[-2,0,2])J(e,t,new r(.34,1.2,7),n.glow,[i,6.5,4.2],[1,1,1],[Math.PI,0,0]);break;case`beast`:J(e,t,new U(1.8,18,12),n.rock,[0,5.1,4.4],[1.45,1.1,1]);for(let i of[-1,1])J(e,t,new r(.42,2.2,8),n.trim,[i*1.65,6.6,4.4],[1,1,1],[0,0,i*.28]);break;case`harbor`:Y(e,t,n.wood,[10.6,.32,2.4],[0,2,4.5],.04);for(let r of[-1,1])X(e,t,n.wood,.16,5.3,[r*3.8,4.4,4.4],8);Y(e,t,n.trim,[8,.22,.22],[0,6.9,4.4],.03);break;case`finale`:Y(e,t,n.trim,[11.4,.4,.7],[0,6.9,4.7],.05);for(let r of[-4.8,-2.4,2.4,4.8])X(e,t,n.stoneLight,.45,5.2,[r,4.1,4.7],12);J(e,t,new V(1.2,1),n.glow,[0,5.2,4.1],[1.25,1.45,.75]);break;case`castle`:for(let r of[-4.3,4.3])Y(e,t,n.stoneLight,[1.2,5.5,1.2],[r,4.2,4.4],.08);Y(e,t,n.trim,[10.5,.5,.9],[0,7.2,4.4],.06)}}function Mt(e,t,n,i){let a=-3.55;switch(i){case`gate`:for(let r of[-1,1])X(e,t,n.stoneLight,1.2,9,[r*7.2,5.2,a],16),X(e,t,n.trim,1.42,.32,[r*7.2,9.8,a],16);Y(e,t,n.trim,[17.8,1,1],[0,9.15,a],.1);for(let r of[-2.05,2.05])X(e,t,n.trim,.14,4.8,[r,4,-3.67],10),J(e,t,new V(.42,1),n.glow,[r,6.2,-3.73],[1,1.2,.35]);break;case`temple`:Z(e,t,n,n.trim,22,8,11.3,-.1,.28);for(let r of[-8.2,-4.1,4.1,8.2])X(e,t,n.stoneLight,.82,8,[r,5.2,a],14);Y(e,t,n.trim,[21,.7,.9],[0,9,a],.08);break;case`maze`:for(let r of[-9,-6,6,9])Y(e,t,n.stoneLight,[2,6.2,2],[r,4.2,a],.12);for(let r of[-8.2,-5.2,5.2,8.2])Y(e,t,n.trim,[1,1,1],[r,8.1,a],.08);Y(e,t,n.dark,[6.4,5.4,.24],[0,4.35,-3.67],.06);break;case`statue`:case`beast`:for(let i of[-1,1])Y(e,t,n.rock,[3.4,5.8,3],[i*7.6,3.9,a],.2),J(e,t,new U(1.55,16,12),n.stoneLight,[i*7.6,8,a],[1.15,1.15,1]),J(e,t,new r(.55,2.8,8),n.trim,[i*7.6,10,a],[1,1,1],[0,0,i*.28]);break;case`bridge`:Z(e,t,n,n.wood,23,10,11.1,1.8,.38);for(let r of[-1,1])Y(e,t,n.wood,[.7,9.6,.7],[r*9.4,5.2,a],.08),Y(e,t,n.wood,[4.8,.42,.42],[r*7,8.4,a],.05);break;case`vine`:Z(e,t,n,n.wood,24,12,10.8,1.4,.5);for(let r of[-1,1]){X(e,t,n.wood,.58,10,[r*9.5,5.7,a],12);let i=J(e,t,new B(3.2,.2,10,36),n.foliage,[r*8.1,6.4,-3.83],[1,1.3,1]);i.rotation.y=r*.2}break;case`tree`:for(let r of[-1,1])X(e,t,n.wood,1.1,9.4,[r*7.7,5.2,a],14,[1.2,1,1]),Y(e,t,n.wood,[9.8,1.3,1],[0,9.2,a],.12);J(e,t,new y(4.7,2),n.foliage,[0,13,.8],[1.8,.65,1.1]);break;case`waterfall`:Y(e,t,n.stoneLight,[22,1,1],[0,9.1,a],.1);for(let r of[-8.5,8.5]){Y(e,t,n.stone,[3,8.2,2.6],[r,4.7,a],.12);let i=J(e,t,new P(3.1,7.4,8,12),n.water,[r,4.2,-3.75]);i.userData.waterSheet=!0}break;case`water`:case`canal`:for(let r of[-1,1])X(e,t,n.stoneLight,.75,8.6,[r*8.6,5,a],14),Y(e,t,n.trim,[5.6,.48,.9],[r*5,8.9,a],.06);Y(e,t,n.water,[7.4,.18,2.8],[0,1.65,-3.9],.12);break;case`harbor`:Z(e,t,n,n.wood,24,13,10.8,1.2,.33);for(let r of[-1,1])X(e,t,n.wood,.24,11,[r*10.2,5.7,a],10),Y(e,t,n.trim,[4.6,.28,.28],[r*7.5,8.6,a],.04);Y(e,t,n.wood,[13,.7,3.2],[0,1.8,-3.15],.08);break;case`cave`:J(e,t,new B(5,1.15,14,40,Math.PI),n.rock,[0,6,a],[1.35,1.18,1]),Y(e,t,n.dark,[11.2,6.4,.3],[0,3,-3.6999999999999997],.08);for(let i of[-1,1])J(e,t,new r(.55,2.2,8),n.glow,[i*3.8,7.2,-3.83],[1,1,1],[Math.PI,0,0]);break;case`volcano`:for(let i of[-1,1])J(e,t,new r(3.8,9,8),n.rock,[i*7,4.8,a],[1,1,.9],[.08,i*.15,0]),X(e,t,n.glow,1.1,.16,[i*7,9.4,a],18);break;case`mine`:case`construction`:for(let r of[-1,1])Y(e,t,n.metal,[.65,10.5,.65],[r*9.8,5.8,a],.08),Y(e,t,n.trim,[9.2,.5,.55],[r*5.2,10,a],.06,[0,0,r*.2]);Y(e,t,n.dark,[8.2,5.8,.26],[0,4,-3.65],.06);break;case`observatory`:X(e,t,n.stoneLight,5.5,.35,[0,10.2,-.8],32),J(e,t,new U(5.1,24,16,0,St,0,Math.PI/2),n.window,[0,10.3,-.8],[1,.66,1]),X(e,t,n.trim,5.5,.24,[0,10.32,-.8],32),Y(e,t,n.metal,[.28,.28,11],[0,13.5,-.8],.04,[Math.PI/2,0,.2]);break;case`boulder`:for(let r of[-1,1])J(e,t,new g(3.5,1),n.rock,[r*7,3.7,a],[1.15,1.35,.92],[.1,r*.2,0]);Y(e,t,n.wood,[12,.65,1],[0,8.6,a],.08);break;case`finale`:case`castle`:for(let r of[-9.2,-4.6,4.6,9.2])X(e,t,n.stoneLight,.78,9.2,[r,5.1,a],14);Y(e,t,n.trim,[22,.85,1],[0,9.2,a],.08),J(e,t,new V(2,1),n.glow,[0,12.2,a],[1.2,1.6,.8])}}function Nt(e,t,n){for(let r=0;r<4;r++)Y(e,t,n.stoneLight,[12+r*2.2,.28,1.55],[0,.28+r*.28,-4.8+r*.9],.08)}function Pt(e,t,n){for(let r of[-15,-10.5,10.5,15])Ot(e,t,n,r,3.8,-2.48,3.1,2.1),Ot(e,t,n,r,7,-2.48,2.4,1.55);for(let r of[-1,1])for(let i of[2,7,12])Ot(e,t,n,r*20.2,4.2,i,2.55,1.8,!0)}function Ft(e,t,n,r){for(let r of[-1,1])X(e,t,n.stoneLight,1.02,7.8,[r*6.1,4.6,-2.9],16),X(e,t,n.trim,1.25,.32,[r*6.1,8.6,-2.9],16);let i=J(e,t,new V(1.5,1),n.glow,[0,11.8,-1.2],[1.2,1.5,.7]);if(e.userData.dynamics=[{mesh:i,rate:.22}],r===`gate`||r===`finale`)for(let r of[-1,1]){Y(e,t,n.trim,[.38,9.4,.38],[r*18,5,-2.5],.08);let i=J(e,t,new P(2.8,5.2,2,4),n.glow,[r*18,5.2,-2.65]);i.userData.wave=r,(e.userData.dynamics??=[]).push({mesh:i,rate:r*.24})}}function It(e,t,n,r){for(let r of[-1,1])Y(e,t,n.wood,[.55,9.3,.55],[r*11.6,5,-2.9],.12,[0,0,r*.16]),Y(e,t,n.wood,[11.8,.5,.55],[0,8.5,-2.9],.12,[0,0,r*.02]);At(e,t,n,-18,-1.5,3.8,.2),At(e,t,n,18,-1.5,4.5,2.4);for(let r of[-1,1]){let i=J(e,t,new B(2.3,.13,8,28,Math.PI*1.25),n.foliage,[r*15,6.2,-2.75],[1,1.5,1],[0,r*.22,0]);(e.userData.dynamics??=[]).push({mesh:i,rate:r*.2})}if(r===`tree`){X(e,t,n.wood,2.7,10,[0,5.5,9],14,[1.25,1,1.25]),J(e,t,new y(5.6,2),n.foliage,[0,11,9],[1.45,.85,1.45]);for(let r of[0,Math.PI/2,Math.PI,Math.PI*1.5])Y(e,t,n.wood,[.42,.42,7],[Math.cos(r)*5,4,9+Math.sin(r)*5],.08,[0,r,0])}}function Lt(e,t,n,r){for(let r of[-1,1]){let i=Y(e,t,n.water,[9.5,.18,5.4],[r*13,.36,8.4],.35);i.renderOrder=1;for(let i of[6.8,8.8,10.8]){let a=J(e,t,new B(1.3,.08,8,24),n.glow,[r*13,.5,i],[1.2,.7,.6],[Math.PI/2,0,0]);(e.userData.dynamics??=[]).push({mesh:a,rate:.12+r*.05})}}if(r===`waterfall`||r===`cave`)for(let r of[-1,1]){let i=J(e,t,new P(4.2,8.5,8,16),n.water,[r*9.6,4.4,.2],void 0,[0,Math.PI,0]);(e.userData.dynamics??=[]).push({mesh:i,rate:r*.18})}if(r===`canal`||r===`harbor`){Y(e,t,n.water,[12,.16,17],[0,.34,9],.28);for(let r of[-1,1]){Y(e,t,n.wood,[1.1,.6,20],[r*8.5,.62,8],.12);for(let i of[1,6,11,16])X(e,t,n.wood,.25,2.8,[r*8.5,1.2,i],8)}}}function Rt(e,t,n){for(let r of[-1,1])J(e,t,new g(3.8,1),n.rock,[r*14,3.4,8],[1.1,1.25,.9],[.1,r*.25,.2]),Y(e,t,n.glow,[.22,4.8,.22],[r*13.1,3.1,4.5],.06,[.16,r*.25,.18]);let r=J(e,t,new B(6.2,.2,8,40),n.glow,[0,.5,8],[1,.62,1],[Math.PI/2,0,0]);(e.userData.dynamics??=[]).push({mesh:r,rate:.32})}function zt(e,t,n,r){for(let r of[-1,1])Y(e,t,n.metal,[.75,11,.75],[r*18,5.8,8],.12),Y(e,t,n.metal,[36,.72,.72],[0,10.8,8],.12),X(e,t,n.trim,1.25,.26,[r*11,8.8,-2.8],16,void 0,[Math.PI/2,0,0]);if(r===`construction`){Y(e,t,n.metal,[1.2,16,1.2],[13,8.4,10],.15),Y(e,t,n.trim,[21,.7,.7],[2.5,15.5,10],.12,[0,0,-.12]);let r=X(e,t,n.metal,.1,8,[3,11.5,8],8,void 0,[0,0,Math.PI/2]);r.rotation.z=Math.PI/2,kt(e,t,n,[3,7.3,8],16759896)}if(r===`mine`){for(let r of[-1,1]){Y(e,t,n.wood,[.4,.4,19],[r*2,.7,8],.06);for(let r of[1,5,9,13,17])Y(e,t,n.metal,[6,.32,.32],[0,1,r],.04)}X(e,t,n.glow,1.25,.18,[0,2.4,-1],20,void 0,[Math.PI/2,0,0])}}function Bt(e,t,n){let r=J(e,t,new U(5.8,24,16,0,St,0,Math.PI/2),n.window,[7.2,13,9.5],[.92,.5,.92]);r.material=n.window,X(e,t,n.trim,5.5,.35,[7.2,10.15,9.5],32);let i=J(e,t,new B(5.8,.22,10,42),n.glow,[7.2,13,9.5],[.92,.5,.92]);i.rotation.x=Math.PI/2,(e.userData.dynamics??=[]).push({mesh:i,rate:.16}),Y(e,t,n.metal,[.34,.34,9],[7.2,13.8,9.5],.05,[Math.PI/2,0,.18])}function Vt(e,t,n){let r=J(e,t,new B(7,1.35,12,36,Math.PI),n.rock,[0,5.1,-3.1],[1.2,1.1,1],[0,0,0]);r.rotation.x=Math.PI/2,Y(e,t,n.dark??n.rock,[11,6,.35],[0,2.8,-3.1],.08);for(let r of[-1,1])J(e,t,new V(.9,1),n.glow,[r*8,3.8,-3.5],[1,2.1,1])}function Ht(e,t,n,r,i,a=.11){let o=new p(...n),s=new p(...r),c=s.clone().sub(o),l=c.length(),u=o.clone().add(s).multiplyScalar(.5),d=X(e,t,i,a,l,[u.x,u.y,u.z],8);return d.quaternion.setFromUnitVectors(new p(0,1,0),c.normalize()),d}function Ut(e,t,n,i){let a=-3.25;switch(Y(e,t,n.stoneLight,[38.5,.18,.28],[0,1.88,a],.03),Y(e,t,n.trim,[15.5,.12,.36],[0,1.98,-3.57],.02),Y(e,t,n.stoneLight,[40.2,.28,.52],[0,9.55,-2.72],.05),i){case`gate`:case`finale`:case`castle`:{Z(e,t,n,n.stoneLight,27,13,13.05,3.4,.34),Z(e,t,n,n.trim,22,7,10.85,a,.24);let r=J(e,t,new B(5,.48,12,36,Math.PI),n.trim,[0,5.45,-3.63]);r.rotation.y=Math.PI;for(let r of[-1,1])X(e,t,n.stoneLight,.78,8.8,[r*10.4,4.95,a],14),Y(e,t,n.trim,[4.8,.24,.42],[r*7.9,9.3,a],.03);break}case`temple`:Z(e,t,n,n.trim,35,18,13.4,4.5,.3),Z(e,t,n,n.stoneLight,27,10,10.65,a,.28);for(let r of[-12.5,-6.2,6.2,12.5])X(e,t,n.stoneLight,.58,8.7,[r,4.9,a],14),X(e,t,n.trim,.78,.22,[r,9.35,a],14);Y(e,t,n.trim,[28,.3,.64],[0,10,a],.04);break;case`maze`:Z(e,t,n,n.rock,31,16,12.7,4.5,.46);for(let r of[-15,-10,10,15])Y(e,t,n.stoneLight,[2.2,6.8,2.2],[r,4.8,a],.12),Y(e,t,n.trim,[2.6,.38,2.6],[r,8.35,a],.05);Y(e,t,n.dark,[7.2,5.8,.3],[0,4.35,-3.47],.05);for(let r of[-3.2,3.2])Y(e,t,n.trim,[.28,6.2,.36],[r,4.2,-3.65],.03);break;case`statue`:case`beast`:Z(e,t,n,n.rock,30,17,12.8,4.8,.34);for(let i of[-1,1]){let o=Y(e,t,n.rock,[4.8,4.6,3.2],[i*8.8,3.1,a],.22);o.rotation.z=i*.06,J(e,t,new U(1.45,16,12),n.stoneLight,[i*8.8,7,-3.35],[1.25,1.35,1]),J(e,t,new r(.5,2.8,8),n.trim,[i*8.8,9,-3.35],[1,1,1],[0,0,i*.22])}break;case`bridge`:case`vine`:case`tree`:Z(e,t,n,n.wood,36,19,13.3,4.8,.48),Z(e,t,n,n.foliage,25,9,10.65,a,.32);for(let r of[-1,1])Y(e,t,n.wood,[.56,10.2,.56],[r*12.2,5.35,a],.08),Y(e,t,n.wood,[11.6,.44,.5],[0,9.25,a],.06);if(i===`bridge`||i===`vine`)for(let r of[-8,-4,4,8])Y(e,t,n.wood,[.28,6.1,.28],[r,4,-3.5300000000000002],.04,[0,0,r*.012]);break;case`waterfall`:{Z(e,t,n,n.stoneLight,33,18,13,4.8,.3);let r=J(e,t,new B(5.2,.42,10,34,Math.PI),n.water,[0,5.35,-3.69]);r.rotation.y=Math.PI;for(let r of[-1,1]){Y(e,t,n.stone,[4.4,7.2,3],[r*10.5,4.6,a],.18);let i=J(e,t,new P(3.5,7,6,14),n.water,[r*10.5,4,-3.6]);i.userData.waterSheet=!0}Y(e,t,n.trim,[24,.34,.7],[0,9.25,a],.04);break}case`water`:case`canal`:case`harbor`:{Z(e,t,n,n.trim,34,18,13,5,.3);let r=J(e,t,new B(5.1,.42,10,34,Math.PI),n.trim,[0,5.25,-3.71]);r.rotation.y=Math.PI;for(let r of[-1,1])X(e,t,n.stoneLight,.82,8.4,[r*11.5,4.8,a],14),Y(e,t,n.water,[3.8,.18,9.4],[r*7.5,1.8,-2.35],.08);if(i===`harbor`)for(let r of[-1,1])Y(e,t,n.wood,[.32,11,.32],[r*15.4,5.5,a],.04),Y(e,t,n.trim,[4.6,.18,.18],[r*12.7,9.4,a],.02);break}case`volcano`:Z(e,t,n,n.rock,31,17,12.6,5,.36);for(let i of[-1,1])J(e,t,new r(2,7.2,8),n.rock,[i*11.2,4.3,a],[1,1,1],[.08,i*.14,0]),X(e,t,n.glow,.62,.18,[i*11.2,8,a],16);Y(e,t,n.glow,[.28,.22,15.5],[0,2.3,1],.03,[.06,0,0]);break;case`mine`:case`construction`:Z(e,t,n,n.metal,35,19,13.1,5,.18);for(let r of[-1,1])Y(e,t,n.metal,[.58,12,.58],[r*15.5,6.1,a],.06),Y(e,t,n.trim,[8.2,.32,.32],[r*11.4,10.2,a],.03,[0,0,r*.2]);Y(e,t,n.trim,[22,.32,.38],[0,11,a],.03);for(let r of[-1,1])Y(e,t,n.trim,[7.5,.24,.26],[r*4.7,6.8,-3.57],.03,[0,0,r*.34]),Y(e,t,n.metal,[7.5,.24,.26],[r*4.7,5,-3.61],.03,[0,0,r*-.28]);i===`construction`&&(Y(e,t,n.metal,[.7,15.2,.7],[13.5,8,8],.08),Y(e,t,n.trim,[19,.42,.42],[4,14.5,8],.04,[0,0,-.14]));break;case`observatory`:{Z(e,t,n,n.stoneLight,28,17,12.6,5,.2);let r=J(e,t,new U(5.1,24,14,0,St,0,Math.PI/2),n.window,[0,12,-.75],[1,.56,1]);r.userData.observatoryDome=!0,X(e,t,n.trim,5,.25,[0,10.18,-.75],28),Y(e,t,n.metal,[.3,.3,9.5],[0,14.2,-.75],.03,[Math.PI/2,0,.18]);break}case`cave`:case`boulder`:{Z(e,t,n,n.rock,31,18,12.5,4.8,.52);let o=J(e,t,new B(6.4,1.25,14,40,Math.PI),n.rock,[0,5,-3.4],[1.25,1.1,1]);o.rotation.y=Math.PI;for(let r of[-6.8,6.8])J(e,t,new g(2,1),n.rock,[r,3,a],[1.2,1.5,1]);if(i===`cave`)for(let i of[-3.4,0,3.4])J(e,t,new r(.42,2.2,8),n.glow,[i,7,-3.6],[1,1,1],[Math.PI,0,0]);break}}}function Wt(e,t,n,i){let a=-3.82,o=n.glow.color.getHex(),s=(r,i,o,s=n.trim)=>{let c=1.98;Y(e,t,s,[.42,o,.62],[r-i*.5,c+o*.5,a],.06),Y(e,t,s,[.42,o,.62],[r+i*.5,c+o*.5,a],.06);let l=J(e,t,new B(i*.5,.3,10,32,Math.PI),s,[r,c+o,a]);l.rotation.y=Math.PI,Y(e,t,n.glow,[.12,o-.7,.08],[r-i*.5+.24,c+o*.5,-4.16],.02),Y(e,t,n.glow,[.12,o-.7,.08],[r+i*.5-.24,c+o*.5,-4.16],.02)},c=(r,i,o,s=n.stoneLight)=>Y(e,t,s,[i,.34,.72],[r,o,a],.05),l=(r,i,a=.72,o=2.6,s=n.window)=>{Ot(e,t,n,r,i,-3.9,a,o),Y(e,t,n.trim,[a+.32,.14,.34],[r,i+o*.5+.16,-4.04],.03)},u=(r,i,a,o=n.glow)=>{let s=X(e,t,o,a,.22,[r,i,-4.24],20,void 0,[Math.PI/2,0,0]);return s.castShadow=!0,s};switch(i){case`gate`:case`finale`:case`castle`:s(0,5.8,6.6,n.trim),s(-8,3.7,5,n.stoneLight),s(8,3.7,5,n.stoneLight),c(0,7.6,9.12,n.trim),u(0,8.18,1.15);for(let e of[-13.4,-10.8,10.8,13.4])l(e,5,.62,2.8);for(let r of[-5,5])kt(e,t,n,[r,7.2,-4.32],o);break;case`temple`:for(let r of[-13,-8.6,-4.3,4.3,8.6,13])X(e,t,n.stoneLight,.62,8.3,[r,5.9,a],16),X(e,t,n.trim,.82,.2,[r,10.1,a],16);c(0,31,10.25,n.trim),s(0,6.2,6.2,n.stoneLight),u(0,8,1.65,n.trim);for(let e of[-10.8,-6.2,6.2,10.8])l(e,6.3,1.2,2.5);break;case`maze`:for(let r of[-15.5,15.5]){Y(e,t,n.rock,[3.2,9.8,3.2],[r,6.8,a],.14);for(let e of[5.1,7.5,9.9])l(r,e,.52,1,n.trim)}s(0,6.4,6.4,n.rock),c(0,9.4,9.1,n.trim);for(let e of[-12,-8,8,12])l(e,5,.56,2.4);break;case`statue`:case`beast`:for(let r of[-1,1])Y(e,t,n.rock,[4.4,5.4,3.8],[r*9.3,4.2,a],.22),J(e,t,new g(1.55,1),n.stoneLight,[r*9.3,8,-4.02],[1.2,1.5,1]);s(0,7.4,6.7,n.trim);for(let r of[-1,1])u(r*9.3,8.35,.78,n.glow),kt(e,t,n,[r*4.3,7,-4.32],o);if(i===`beast`){u(0,11.5,.58,n.glow);for(let i of[-2.2,-.75,.75,2.2])J(e,t,new r(.18,.95,8),n.stoneLight,[i,4.35,-4.37],[1,1,1],[Math.PI,0,0])}break;case`bridge`:case`vine`:case`tree`:{let r=i===`tree`?11.4:10.2;for(let i of[-1,1])Ht(e,t,[i*12.5,2,a],[i*7.5,r,a],n.wood,.22),Ht(e,t,[i*7.5,2,a],[i*12.5,r,a],n.wood,.18),kt(e,t,n,[i*5.2,7.3,-4.22],o);s(0,6.4,6.1,n.wood),c(0,15.2,r+.2,n.wood);for(let e of[-10.8,-8,8,10.8])l(e,5.8,1,2.5,n.window);if(i===`vine`||i===`tree`)for(let r of[-1,1]){let i=J(e,t,new B(2.4,.14,8,28,Math.PI*1.3),n.foliage,[r*11.8,6.5,-4.17],[1,1.25,1]);i.rotation.y=r*.18}break}case`waterfall`:for(let r of[-1,1]){Y(e,t,n.stone,[4,8.8,3.6],[r*10.8,5.5,a],.18),s(r*10.8,2.1,5.4,n.trim);let i=J(e,t,new P(2.2,6.7,6,14),n.water,[r*10.8,4.2,-4.2]);i.userData.waterSheet=!0}s(0,7.1,6.8,n.stoneLight),c(0,18,9.3,n.trim);for(let e of[-5.8,5.8])l(e,6,1.3,2.7);break;case`water`:case`canal`:case`harbor`:for(let e of[-10,0,10])s(e,4,5.2,i===`harbor`?n.wood:n.stoneLight);c(0,27,8.6,n.trim);for(let e of[-13.2,-6.5,6.5,13.2])l(e,5.2,1.15,2.3);Y(e,t,n.water,[19,.16,1.1],[0,2,-4.27],.05);for(let r of[-8,8])kt(e,t,n,[r,7.1,-4.27],o);i===`harbor`&&(Ht(e,t,[-12,2.1,-4.32],[-5.5,10.8,-4.32],n.wood,.2),Ht(e,t,[12,2.1,-4.32],[5.5,10.8,-4.32],n.wood,.2));break;case`volcano`:for(let r of[-1,1]){Y(e,t,n.rock,[5.1,9.6,3.8],[r*10.2,5.3,a],.16);for(let i of[3.2,5.2,7.2])Y(e,t,n.glow,[.16,1.35,.08],[r*10.2,i,-4.32],.02,[0,0,r*.14])}s(0,7,6.6,n.rock),c(0,19,9.15,n.trim);for(let r of[-5.5,5.5])kt(e,t,n,[r,7.1,-4.3],16746312);break;case`mine`:case`construction`:for(let r of[-1,1])Ht(e,t,[r*13.4,2,a],[r*8,11.4,a],n.metal,.24),Ht(e,t,[r*8,2,a],[r*13.4,11.4,a],n.metal,.18);s(0,7.8,6.4,n.metal),c(0,22,10.55,n.trim);for(let e of[-10.8,-7.2,7.2,10.8])l(e,5.4,1.1,2.3,n.window);for(let r of[-4.6,4.6])kt(e,t,n,[r,7.2,-4.32],16759896);break;case`observatory`:X(e,t,n.stoneLight,5.8,.32,[0,2.05,a],32);for(let r of[-4.5,-2.25,2.25,4.5])X(e,t,n.trim,.32,6.8,[r,5.3,a],12);s(0,6.2,5.8,n.trim),u(0,8.2,1,n.window);for(let e of[-10.6,10.6])l(e,5.3,1.2,2.4);break;case`cave`:case`boulder`:{let i=J(e,t,new B(5.7,1,14,42,Math.PI),n.rock,[0,7.1,a],[1.35,1.2,1]);i.rotation.y=Math.PI,Y(e,t,n.dark,[8.6,5.2,.25],[0,4,-3.6199999999999997],.05);for(let i of[-4.7,-2.2,2.2,4.7])J(e,t,new r(.34,1.8,7),n.glow,[i,6.7,-4.24],[1,1,1],[Math.PI,0,0]),l(i,9,.6,1.3,n.trim);break}}}function Gt(e,t,n,i){let a=10.8,o=(r,i,a=n.trim)=>Y(e,t,a,[4.8,.26,4.8],[r,13.3,i],.06),s=(r,i,a,o=n.glow)=>J(e,t,new V(.85,1),o,[r,i,a],[1.1,1.8,1.1]),c=(r,i,a,o,s=n.window)=>{let c=J(e,t,new B(o,.16,8,24,Math.PI),n.trim,[r,i,a]);c.rotation.y=Math.PI,Y(e,t,s,[o*1.55,o*1.7,.12],[r,i-o*.48,a],.04)};switch(i){case`gate`:case`finale`:case`castle`:Y(e,t,n.stone,[18,5.4,10],[0,11,a],.18),Z(e,t,n,n.stoneLight,20,11,14,a,.34);for(let r of[-1,1]){Y(e,t,n.stoneLight,[5.2,12.8,5.2],[r*13.2,7,a],.18),o(r*13.2,a,n.trim);for(let i of[-1.05,1.05])Y(e,t,n.trim,[.42,.8,.9],[r*13.2+i,13,10.700000000000001],.04);s(r*13.2,15,a)}s(0,16,a,n.trim);break;case`temple`:Y(e,t,n.stone,[31,3.3,8.5],[0,9.7,a],.12),Z(e,t,n,n.trim,34,10,13,a,.26),Z(e,t,n,n.stoneLight,25,8,15,11,.22);for(let r of[-11,-5.5,5.5,11])X(e,t,n.stoneLight,.56,5.8,[r,12,9.600000000000001],14),c(r,13.9,9.3,.78);s(0,16.4,a,n.trim);break;case`maze`:for(let r of[-1,1]){Y(e,t,n.rock,[6.4,13.5,6.4],[r*12.6,7.2,a],.2),o(r*12.6,a,n.stoneLight);for(let i of[-1.7,0,1.7])Y(e,t,n.trim,[.92,.72,.92],[r*12.6+i,13.8,a],.06)}Y(e,t,n.stone,[19,6.2,3.2],[0,5.4,12.4],.14);for(let e of[-7.2,-3.6,3.6,7.2])c(e,7.1,10.75,.8,n.trim);break;case`statue`:case`beast`:{Y(e,t,n.rock,[20,7.5,7],[0,6.2,a],.22),Z(e,t,n,n.rock,23,8,11,a,.34);for(let r of[-1,1])X(e,t,n.stoneLight,.72,7,[r*7,6.6,7.9],16),X(e,t,n.trim,.92,.22,[r*7,10.2,7.9],16);let o=J(e,t,i===`beast`?new U(2.15,18,12):new g(2,1),i===`beast`?n.rock:n.stoneLight,[0,13.1,10.3],i===`beast`?[1.5,1,1.18]:[1.1,1.35,.85]);if(o.userData.highlight=!0,i===`beast`)for(let i of[-1,1])J(e,t,new r(.45,2.4,8),n.trim,[i*1.9,14.6,10.4],[1,1,1],[0,0,i*.28]);break}case`bridge`:case`vine`:case`tree`:for(let r of[-1,1])Y(e,t,n.wood,[1,14,1],[r*14.2,7,a],.12),Y(e,t,n.wood,[4.8,.8,1],[r*12,13.1,a],.08),Ht(e,t,[r*14.2,2,8],[r*7,12.4,8],n.wood,.24),Ht(e,t,[r*7,2,8],[r*14.2,12.4,8],n.wood,.18);if(Y(e,t,n.wood,[27,.7,.86],[0,13.4,a],.08),i===`tree`)X(e,t,n.wood,3.1,12.5,[0,6.6,12.4],16,[1.2,1,1.2]),J(e,t,new y(5.4,2),n.foliage,[0,14.2,12.4],[1.5,.72,1.5]);else for(let r of[-1,1]){let i=J(e,t,new B(2.6,.16,8,28,Math.PI*1.35),n.foliage,[r*11.5,8.3,10.3],[1,1.25,1]);i.rotation.y=r*.2}break;case`waterfall`:Y(e,t,n.stone,[22,8.2,6.4],[0,6.1,a],.16),Z(e,t,n,n.stoneLight,25,8,11.3,a,.28);for(let r of[-1,1]){let i=J(e,t,new P(3.2,7.2,8,16),n.water,[r*7.1,5,7.6000000000000005]);i.userData.waterSheet=!0,Y(e,t,n.trim,[3.8,.22,.54],[r*7.1,8.55,7.300000000000001],.04)}for(let e of[-4.5,0,4.5])c(e,7.1,7.550000000000001,.86);break;case`water`:case`canal`:case`harbor`:Y(e,t,n.stone,[32,5.4,5],[0,5,a],.14);for(let r of[-12,-6,0,6,12])X(e,t,n.stoneLight,.72,6.4,[r,6.4,8.600000000000001],14),c(r,9.9,8.25,.72,n.window);if(Y(e,t,n.trim,[35,.48,5.8],[0,9.9,a],.06),i===`harbor`)for(let r of[-1,1])Y(e,t,n.wood,[.7,14,.7],[r*15.5,7,12],.08),Ht(e,t,[r*15.5,13.5,12],[0,16.5,12],n.wood,.2);break;case`volcano`:{J(e,t,new r(7.8,13,10),n.rock,[0,6.5,a],[1.2,1,.92]);let i=J(e,t,new B(4.2,.34,8,32),n.glow,[0,13.1,a],[1.25,.72,1],[Math.PI/2,0,0]);(e.userData.dynamics??=[]).push({mesh:i,rate:.24});for(let i of[-1,1])J(e,t,new r(2,6,8),n.rock,[i*9,3,11.600000000000001],[1,1,.86]),s(i*9,6.3,11.600000000000001,n.glow);break}case`mine`:case`construction`:for(let r of[-1,1])Y(e,t,n.metal,[.8,16,.8],[r*15.5,8,a],.08),Ht(e,t,[r*15.5,15.2,a],[0,18,a],n.metal,.24),Ht(e,t,[r*15.5,2,a],[0,15.2,a],n.trim,.16);Y(e,t,n.metal,[27,.7,.7],[0,12,a],.06);for(let r of[-8,0,8])Y(e,t,n.window,[5.8,4.2,.12],[r,7.2,10.65],.03);i===`construction`&&(Y(e,t,n.trim,[.72,20,.72],[12,9.8,12.600000000000001],.08),Ht(e,t,[12,18.5,12.600000000000001],[-2,18.5,12.600000000000001],n.trim,.2));break;case`observatory`:X(e,t,n.stone,7.3,8.6,[0,5.6,a],28),X(e,t,n.trim,7.6,.34,[0,9.95,a],28),J(e,t,new U(6.9,28,18,0,St,0,Math.PI/2),n.window,[0,10.1,a],[1,.62,1]),X(e,t,n.trim,6.9,.26,[0,10.15,a],28),Y(e,t,n.metal,[.34,.34,12],[0,15.2,a],.04,[Math.PI/2,0,.18]);break;case`cave`:case`boulder`:for(let r of[-1,1])J(e,t,new g(4.2,1),n.rock,[r*9.5,4.3,a],[1.35,1.6,1.15],[.12,r*.22,.08]),J(e,t,new g(3.1,1),n.stone,[r*4.5,5,12],[1.2,1.35,.9],[.08,r*.18,.04]);if(J(e,t,new B(6.5,1.15,14,40,Math.PI),n.rock,[0,8.4,9.3],[1.35,1.05,1]),i===`cave`)for(let i of[-3.8,-1.3,1.3,3.8])J(e,t,new r(.42,2.8,8),n.glow,[i,10,8.600000000000001],[1,1,1],[Math.PI,0,0])}}function Kt(e,t,n,i){let a=-4.08;for(let r of[2.35,4.55,6.75,8.95]){for(let[i,o]of[[-15,7],[-7.2,4.5],[7.2,4.5],[15,7]])Y(e,t,n.stone,[o,.075,.26],[i,r,a],.018);for(let i of[-1,1])Y(e,t,n.stoneLight,[1.12,.48,.62],[i*19.75,r+.22,-4.13],.045)}for(let r of[-15,-10.5,10.5,15])for(let i of[3.8,7])Y(e,t,n.trim,[3.7,.12,.34],[r,i-1.32,-4.26],.025),Y(e,t,n.stoneLight,[3.45,.12,.42],[r,i+1.22,-4.24],.025);switch(i){case`gate`:case`finale`:case`castle`:for(let r of[-10.5,-7,-3.5,3.5,7,10.5])Y(e,t,n.trim,[1,.72,.72],[r,10.25,a],.06);for(let r of[-8.8,8.8])Ht(e,t,[r,2,-4.3],[r,9.4,-4.3],n.stoneLight,.12);break;case`temple`:for(let r of[-13.2,-8.8,-4.4,0,4.4,8.8,13.2])Y(e,t,n.trim,[2.25,.18,.48],[r,10.48,-4.2],.035);for(let r of[11.3,12.3,13.3])X(e,t,n.glow,.52,.1,[0,r,-4.42],16,void 0,[Math.PI/2,0,0]);break;case`maze`:for(let r of[-1,1]){for(let i of[3,5.2,7.4,9.6])Y(e,t,n.rock,[2.7,.42,.58],[r*15.5,i,-4.26],.04);for(let i of[r*12.4,r*8.9])Y(e,t,n.trim,[.22,2,.38],[i,5.4,-4.36],.03)}break;case`statue`:case`beast`:for(let r of[-6.8,-4.5,-2.2,2.2,4.5,6.8])J(e,t,new g(.38,1),n.trim,[r,9.45,-4.4],[1.2,.8,.5]);if(i===`beast`)for(let i of[-1,1])J(e,t,new r(.32,1.8,8),n.trim,[i*2.1,5,-4.58],[1,1,1],[0,0,i*.3]);break;case`bridge`:case`vine`:case`tree`:for(let r of[-1,1])Y(e,t,n.trim,[.34,.34,4.8],[r*6.2,6.15,-4.34],.035),Ht(e,t,[r*9.8,2.5,-4.42],[r*6.2,8.8,-4.42],n.wood,.14);i===`tree`&&J(e,t,new y(3,1),n.foliage,[0,12.4,-3.2800000000000002],[1.7,.56,.9]);break;case`waterfall`:case`water`:case`canal`:case`harbor`:for(let r of[-12.5,-8.3,8.3,12.5])Y(e,t,n.stoneLight,[.32,6.2,.34],[r,4.8,-4.34],.035),Y(e,t,n.water,[2.8,.13,.42],[r*.72,2.25,-4.5],.025);if(i===`harbor`)for(let r of[-1,1])Ht(e,t,[r*5,2.2,-4.6],[r*12,8.2,-4.6],n.wood,.15);break;case`volcano`:for(let r of[-1,1]){for(let i of[3,5,7])Y(e,t,n.glow,[.12,1,.1],[r*10.2,i,-4.54],.02,[0,0,r*.16]);Y(e,t,n.rock,[4.2,.18,.38],[r*10.2,2.28,-4.34],.03)}break;case`mine`:case`construction`:for(let r of[-1,1]){for(let i of[3,5,7,9])X(e,t,n.trim,.16,.12,[r*15,i,-4.42],8,void 0,[Math.PI/2,0,0]);for(let i of[r*5,r*7.5])Y(e,t,n.glow,[1.7,.12,.08],[i,4.2,-4.48],.02,[0,0,r*.35])}break;case`observatory`:{let r=J(e,t,new B(3.9,.18,8,36),n.trim,[0,9.9,-4.42],[1,.7,1]);r.rotation.x=Math.PI/2;for(let r of[-4.8,4.8])X(e,t,n.glow,.42,.18,[r,6.2,-4.44],14,void 0,[Math.PI/2,0,0]);break}case`cave`:case`boulder`:for(let a of[-1,1]){for(let r of[3,5,7])Y(e,t,n.rock,[4.6,.22,.5],[a*8.8,r,-4.36],.08,[0,0,a*.08]);i===`cave`&&J(e,t,new r(.28,1.6,7),n.glow,[a*4,7.6,-4.6],[1,1,1],[Math.PI,0,0])}}}function qt(e,t,n,i){for(let r of[-4.8,0,4.8])Y(e,t,n.window,[3.65,2.55,.16],[r,5.15,6.55],.04),Y(e,t,n.trim,[3.9,.12,.24],[r,6.5,6.43],.03),Y(e,t,n.glow,[2.65,.1,.08],[r,4,6.3999999999999995],.02);for(let r of[-4.8,0,4.8])kt(e,t,n,[r,7.25,3.5],n.glow.color.getHex());switch(i){case`bridge`:case`vine`:case`tree`:for(let r of[-1,1])Ht(e,t,[r*6.5,2,.8],[r*3,7.8,5.9],n.wood,.16);break;case`waterfall`:case`water`:case`canal`:case`harbor`:Y(e,t,n.water,[8.8,.14,2.1],[0,2.05,4.9],.06);for(let r of[-1,1])X(e,t,n.trim,.2,4.4,[r*3.9,4.1,4.9],10);break;case`mine`:case`construction`:for(let r of[-1,1])Ht(e,t,[r*5.8,2,3.9],[r*2.2,7.7,6],n.metal,.14),Y(e,t,n.trim,[2.2,.16,.12],[r*4.8,6.15,6.2],.02);break;case`observatory`:{let r=X(e,t,n.metal,.26,5.8,[0,4.3,4.6],12,void 0,[.16,0,-.22]);r.rotation.z=-.24;break}case`volcano`:for(let r of[-4.8,0,4.8])Y(e,t,n.glow,[.24,2.5,.1],[r,4.9,6.35],.02,[0,0,r*.015]);break;case`cave`:case`boulder`:for(let i of[-4.2,0,4.2])J(e,t,new r(.3,1.45,7),n.glow,[i,6.95,5.9],[1,1,1],[Math.PI,0,0])}}function Jt(e,t,n,i){for(let r of[-5.8,-2.9,0,2.9,5.8])Y(e,t,n.wood,[.28,.32,7.1],[r,8.42,2.55],.035),Y(e,t,n.trim,[.62,.08,6.7],[r,8.22,2.55],.018);for(let r of[-4.8,-2.4,0,2.4,4.8])Y(e,t,n.trim,[1.3,.08,.9],[r,1.83,3],.02),Y(e,t,n.glow,[.64,.055,.06],[r,2.02,3],.014);switch(Y(e,t,n.wood,[3.6,.65,1.25],[0,3,5.5],.07),Y(e,t,n.trim,[3.25,.08,1],[0,3.36,5.5],.02),J(e,t,new V(.58,1),n.glow,[0,4.15,5.5],[1,1.28,.72]),i){case`gate`:case`finale`:case`castle`:for(let r of[-1,1])Y(e,t,n.trim,[.18,5.2,.18],[r*6,5.7,5.9],.02);break;case`temple`:for(let r of[-4.5,0,4.5])Y(e,t,n.glow,[2.8,.08,.08],[r,6.9,6.48],.015);break;case`bridge`:case`vine`:case`tree`:for(let r of[-1,1])Ht(e,t,[r*6,2,2.4],[r*3,7.8,6],n.wood,.13);break;case`waterfall`:case`water`:case`canal`:case`harbor`:Y(e,t,n.water,[5.8,.1,.55],[0,4.15,5.9],.02);for(let r of[-2.4,2.4])X(e,t,n.water,.15,2.8,[r,5.4,5.9],10);break;case`volcano`:for(let r of[-4.2,0,4.2])Y(e,t,n.glow,[.11,2.1,.07],[r,5.3,6.4],.02,[0,0,r*.025]);break;case`mine`:case`construction`:for(let r of[-1,1])Ht(e,t,[r*5.6,2,3.4],[r*2.4,7.8,6],n.metal,.12);break;case`observatory`:{let r=J(e,t,new B(1.25,.12,8,24),n.trim,[0,4.5,5.55]);r.rotation.x=Math.PI/2;break}case`cave`:case`boulder`:for(let i of[-3.8,0,3.8])J(e,t,new r(.24,1.1,7),n.glow,[i,5.8,6.1],[1,1,1],[Math.PI,0,0])}}function Yt(e,t,n,i){let a=[[-17,5.8],[-10.9,3.6],[-5.9,2],[5.9,2],[10.9,3.6],[17,5.8]];for(let[r,i,o]of[[.93,0,n.stone],[1.29,-.12,n.stoneLight]])for(let[n,s]of a)Y(e,t,o,[s,.18,.72],[n,r,-4.58+i],.045);Y(e,t,n.stoneLight,[17.8,.14,3.1],[0,1.78,-4.04],.035),Y(e,t,n.dark,[11.7,.075,1.55],[0,1.88,-4.56],.035);for(let r of[-7.8,-5.2,-2.6,2.6,5.2,7.8])Y(e,t,n.trim,[.08,.04,2.45],[r,1.91,-4.03],.012);for(let r of[-8.8,0,8.8])Y(e,t,n.stone,[7.2,.045,.08],[r,1.93,-4.08],.012);Y(e,t,n.dark,[14.2,.13,2.55],[0,10.02,-3.72],.035),Y(e,t,n.stoneLight,[16.4,.38,3.25],[0,10.32,-3.82],.08),Y(e,t,n.trim,[17.1,.16,3.5],[0,10.57,-3.84],.045);for(let r of[-7.1,-3.55,3.55,7.1])X(e,t,n.stoneLight,.42,7.7,[r,5.22,-3.62],14),X(e,t,n.trim,.55,.18,[r,9.03,-3.62],14),Y(e,t,n.stone,[1.18,.18,1.12],[r,1.98,-3.62],.04);for(let r of[-1,1]){for(let i of[-1.2,4.2,9.6])Y(e,t,n.stoneLight,[.34,6.8,1.05],[r*20.55,5.15,i],.06),Y(e,t,n.trim,[.46,.18,1.32],[r*20.5,8.62,i],.035);Y(e,t,n.stone,[3.8,.28,1],[r*18.7,10.02,-1.2],.05),Y(e,t,n.trim,[4.2,.11,1.18],[r*18.7,10.24,-1.2],.03),Y(e,t,n.stoneLight,[3.8,.28,1],[r*18.7,10.02,10.3],.05)}for(let r of[-1,1])Y(e,t,n.stone,[3.6,.92,2.5],[r*21.8,1.38,-4.08],.12),Y(e,t,n.trim,[3.15,.12,2.08],[r*21.8,1.9,-4.08],.04),At(e,t,n,r*21.8,-4.08,3.1,r*.65);switch(i){case`gate`:case`finale`:case`castle`:Z(e,t,n,n.stoneLight,18.5,4.6,11.15,-3.48,.24);for(let r of[-1,1])Y(e,t,n.trim,[2.5,.18,.62],[r*7.1,11.18,-5.46],.035);break;case`temple`:for(let[r,i,a]of[[23,10.98,-3.3],[20.5,11.32,-3.05],[18,11.66,-2.8]])Y(e,t,n.stoneLight,[r,.24,1.15],[0,i,a],.045),Y(e,t,n.trim,[r+.42,.09,1.3],[0,i+.17,a-.05],.025);break;case`bridge`:case`vine`:case`tree`:Z(e,t,n,n.wood,19.2,5.1,11,-3.35,.42);for(let r of[-1,1])Ht(e,t,[r*8.3,2.05,-4.15],[r*6.2,9.9,-4.15],n.wood,.18),Y(e,t,n.trim,[1.45,.22,1.25],[r*7.1,10.36,-3.8],.04);if(i!==`tree`)for(let r of[-1,1]){let i=J(e,t,new B(2,.14,8,28,Math.PI*1.25),n.foliage,[r*8.6,6.7,-4.25],[1,1.1,1]);i.rotation.y=r*.18}break;case`waterfall`:case`water`:case`canal`:case`harbor`:Y(e,t,n.stone,[18.6,.34,4.9],[0,9.74,-3.05],.08),Y(e,t,n.trim,[19.2,.12,5.25],[0,9.98,-3.08],.035),Y(e,t,n.water,[10.4,.12,1.2],[0,2.02,-4.74],.035);for(let r of[-1,1])X(e,t,n.stoneLight,.3,4.7,[r*8.1,4.1,-4.35],12);break;case`volcano`:Y(e,t,n.rock,[17.6,.36,3.6],[0,10.25,-3.66],.1),Y(e,t,n.glow,[12.8,.08,.16],[0,10.08,-5.3],.025);for(let r of[-1,1])Ht(e,t,[r*7,2.1,-4.35],[r*5.1,9.9,-4.35],n.rock,.28);break;case`mine`:case`construction`:Y(e,t,n.metal,[18.4,.28,3.8],[0,10.3,-3.7],.055);for(let r of[-1,1]){Ht(e,t,[r*8.2,2.05,-4.3],[r*6.1,10.4,-4.3],n.metal,.2);for(let i of[3.4,5.2,7,8.8])X(e,t,n.trim,.13,.55,[r*8.2,i,-4.52],8,void 0,[Math.PI/2,0,0])}break;case`observatory`:X(e,t,n.trim,8.4,.22,[0,10.66,-3],32),Y(e,t,n.metal,[.3,.3,18],[0,13.1,-3],.04,[Math.PI/2,0,.18]);for(let r of[-1,1])X(e,t,n.stoneLight,.3,5.5,[r*7,6,-3],12);break;case`cave`:case`boulder`:J(e,t,new B(6.3,.74,12,36,Math.PI),n.rock,[0,9.8,-4.05],[1.35,1,1]);for(let i of[-1,1])J(e,t,new g(1.15,1),n.rock,[i*8,8.7,-4.18],[1.4,1.1,.8]),J(e,t,new r(.25,1.5,7),n.glow,[i*4.2,7.8,-4.66],[1,1,1],[Math.PI,0,0])}}function Xt(e,t,n,r){Y(e,t,n.dark,[19.6,.14,.16],[0,9.64,-3.06],.025);for(let r of[-8.8,-6,6,8.8])Y(e,t,n.dark,[.12,3.55,.14],[r,5,-4.77],.018);for(let r of[-1,1]){for(let i of[2.35,3.9,5.45,7,8.55])Y(e,t,n.rock,[8.25,.075,.13],[r*14.2,i,-2.64],.016);for(let i of[.05,3.1,6.15,9.2,12.25])Y(e,t,n.stoneLight,[.13,.72,1.18],[r*19.36,5.1,i],.02)}for(let r of[-9.7,-4.9,4.9,9.7])Y(e,t,n.stoneLight,[3.7,.1,.3],[r,4,-4.84],.018),Y(e,t,n.trim,[3.45,.06,.12],[r,4.13,-4.97],.012);switch(r){case`gate`:case`finale`:case`castle`:case`temple`:for(let r of[-6.8,-3.4,0,3.4,6.8])Y(e,t,n.trim,[2.2,.08,.22],[r,10.84,-4.949999999999999],.018),Y(e,t,n.dark,[1.65,.07,.11],[r,10.69,-5.01],.012);break;case`bridge`:case`vine`:case`tree`:for(let r of[-1,1]){for(let i of[3,5.2,7.4])Y(e,t,n.wood,[1.45,.16,.18],[r*7.1,i,-4.93],.022);Y(e,t,n.trim,[.24,5.5,.18],[r*9.9,5.35,-4.949999999999999],.022)}break;case`waterfall`:case`water`:case`canal`:case`harbor`:for(let r of[-7.8,-3.9,3.9,7.8])Y(e,t,n.water,[2.25,.09,.16],[r,2.24,-5.01],.018),Y(e,t,n.stoneLight,[.18,3.8,.22],[r,5.1,-4.989999999999999],.02);break;case`volcano`:for(let r of[-7.4,-3.7,3.7,7.4])Y(e,t,n.rock,[2,.12,.24],[r,3.1,-5.01],.026),Y(e,t,n.glow,[.08,1.9,.08],[r,6.1,-5.069999999999999],.012);break;case`mine`:case`construction`:for(let r of[-1,1])for(let i of[2.8,4.4,6,7.6])X(e,t,n.trim,.14,.08,[r*9.5,i,-5.01],8,void 0,[Math.PI/2,0,0]);break;case`observatory`:for(let r of[-.55,-.18,.18,.55]){let i=Math.sin(r)*8.5;Y(e,t,n.metal,[1.3,.1,.22],[i,9.7,-4.989999999999999],.02,[0,r,0])}break;case`cave`:case`boulder`:for(let r of[-1,1])Y(e,t,n.rock,[3.4,.16,.3],[r*6.7,3,-4.949999999999999],.06),Y(e,t,n.glow,[.1,1.4,.08],[r*4.3,6.5,-5.109999999999999],.018)}}function Zt(e,t){let n=new Set;e.userData.dynamics?.forEach(({mesh:e})=>n.add(e));let r=new M,i=new Set;for(let t of[...e.children])t instanceof F&&!n.has(t)&&(t.removeFromParent(),r.add(t),i.add(t.geometry));if(r.children.length!==0){ke(r);for(let t of[...r.children])e.add(t);i.forEach(e=>{t.geometries.delete(e),e.dispose()})}}function Qt(e,t,n,i){Y(e,t,n.stone,[44,.8,28],[0,.4,6],.28),Y(e,t,n.stoneLight,[40,.8,24],[0,1.15,6],.22),Y(e,t,n.stone,[10.5,5.8,17],[-14.2,3.9,6],.2),Y(e,t,n.stone,[10.5,5.8,17],[14.2,3.9,6],.2),Y(e,t,n.stoneLight,[19,8.2,4.6],[0,5.35,9.5],.28);for(let i of[-1,1])Y(e,t,n.stoneLight,[5.1,9.2,5.1],[i*18.6,5.35,5.8],.22),J(e,t,new r(1,1,4),n.trim,[i*18.6,11.7,5.8],[2.7,1.1,2.7],[0,Math.PI/4,0]);J(e,t,new r(1,1,4),n.trim,[0,11.8,6],[10.8,1.12,8.8],[0,Math.PI/4,0]),Nt(e,t,n),Y(e,t,n.stoneLight,[23.5,.42,2.9],[0,10.25,-2.65],.1),Y(e,t,n.trim,[22.2,.16,3.15],[0,10.5,-2.65],.04);for(let r of[-3.1,3.1])Y(e,t,n.trim,[.45,6.5,.55],[r,4,-2],.1);let a=J(e,t,new B(3.2,.34,10,32,Math.PI),n.trim,[0,6.9,-2.05]);a.rotation.y=Math.PI;for(let r of[-10.5,10.5])Y(e,t,n.trim,[.45,6.4,.55],[r,4.1,-2.4],.1);Pt(e,t,n),Y(e,t,n.stoneLight,[14,.5,4.8],[0,8.8,-1],.12);for(let r of[-6,-3,3,6])X(e,t,n.trim,.13,1.5,[r,9.65,-2.7],8),X(e,t,n.trim,.13,1.5,[r,9.65,.2],8);switch(kt(e,t,n,[-4.3,4.1,-2.7],16762475),kt(e,t,n,[4.3,4.1,-2.7],16762475),kt(e,t,n,[0,8.1,-2.9],n.glow.color.getHex()),At(e,t,n,-20,-4,3.1,.4),At(e,t,n,20,-4,3.6,2.1),jt(e,t,n,i),qt(e,t,n,i),Jt(e,t,n,i),Mt(e,t,n,i),Ut(e,t,n,i),Wt(e,t,n,i),Gt(e,t,n,i),Kt(e,t,n,i),Yt(e,t,n,i),Xt(e,t,n,i),i){case`gate`:case`temple`:case`maze`:case`statue`:case`beast`:case`finale`:case`castle`:Ft(e,t,n,i);break;case`bridge`:case`vine`:case`tree`:It(e,t,n,i);break;case`waterfall`:case`water`:case`canal`:case`harbor`:Lt(e,t,n,i);break;case`cave`:Lt(e,t,n,i),Vt(e,t,n);break;case`volcano`:Rt(e,t,n);break;case`mine`:case`construction`:zt(e,t,n,i);break;case`observatory`:Bt(e,t,n);break;case`boulder`:for(let r of[-1,1])J(e,t,new g(3,1),n.rock,[r*15,2.8,9],[1.2,.9,1.1],[.1,r*.35,.12])}return e}function $t(e,t,n,r){let i=new M;i.name=`Floating attraction building · ${n.publicName}`,i.userData.attractionId=n.id,i.userData.pattern=n.pattern,i.userData.building=!0,i.position.z=-15,i.rotation.y=Math.PI,e.add(i);let a=Dt(n,r,t),o=new M;o.name=`Merged architectural shell and facade details`,i.add(o),Qt(o,t,a,n.pattern),Zt(o,t);let s=new ue().setFromObject(o).getSize(new p);return i.userData.architecturePartCount=o.children.length,i.userData.architectureSize=s.toArray(),i.userData.detailTier=`complete-shell-facade-roof-landscaping-massing-interior-depth-micro-v19`,i.userData.facadeCraft=!0,i.userData.massing=!0,i.userData.interiorCraft=!0,i.userData.constructionDepth=!0,i}function en(e,t,n){let r=new M;r.name=`Floating City reflective lagoon and water garden`,e.add(r);let i=new te;i.absellipse(0,0,115,70,0,Math.PI*2,!1,0);let a=new s(i,64);t.geometries.add(a);let o={name:`Floating lagoon scene reflection with turquoise water tint`,uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},time:{value:0}},vertexShader:`uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorldPosition; varying vec3 vWorldNormal;
      void main(){
        vec4 worldPosition=modelMatrix*vec4(position,1.0);
        vWorldPosition=worldPosition.xyz;
        vWorldNormal=normalize(mat3(modelMatrix)*normal);
        vUv=textureMatrix*vec4(position,1.0);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }`,fragmentShader:`uniform vec3 color; uniform sampler2D tDiffuse; uniform float time; varying vec4 vUv; varying vec3 vWorldPosition; varying vec3 vWorldNormal;
      void main(){
        vec2 waveUv=vUv.xy/max(vUv.w,0.0001);
        vec2 distortion=vec2(
          sin(waveUv.y*31.0+time*0.72)+sin(waveUv.x*17.0-time*0.43),
          cos(waveUv.x*27.0-time*0.65)+sin(waveUv.y*13.0+time*0.54)
        )*0.0024;
        vec4 reflectedUv=vUv;
        reflectedUv.xy+=distortion*vUv.w;
        vec3 reflected=texture2DProj(tDiffuse,reflectedUv).rgb;
        float broadWave=pow(max(0.0,sin(waveUv.x*19.0+waveUv.y*7.0+time*0.08)),12.0)*0.045;
        float crossWave=pow(max(0.0,sin(waveUv.x*11.0-waveUv.y*23.0-time*0.06)),14.0)*0.028;
        // Keep the long waves below the threshold where they become obvious
        // diagonal bands.  The high-frequency glints carry the sun response;
        // the broad terms should only break up a perfectly flat reflection.
        float shimmer=pow(max(0.0,sin(waveUv.x*128.0+waveUv.y*37.0+time*0.12)),30.0)*0.07;
        vec3 reflectedColor=pow(max(reflected,vec3(0.0)),vec3(1.08));
        vec3 base=vec3(0.001,0.011,0.020);
        // Use the actual view angle for Fresnel instead of a screen-space
        // brightness pattern.  This keeps the lake deep and readable in a
        // wide hub shot while naturally catching more sky and architecture at
        // grazing angles.  The reflected texture is still the live scene
        // capture; the tint only supplies the water's absorption colour.
        vec3 viewDirection=normalize(cameraPosition-vWorldPosition);
        float viewCosine=clamp(abs(dot(viewDirection,normalize(vWorldNormal))),0.0,1.0);
        float physicalFresnel=pow(1.0-viewCosine,4.0);
        float reflectionWeight=clamp(0.82+physicalFresnel*0.15,0.0,0.985);
        // Keep the live scene capture legible while applying water absorption
        // and a deeper teal bias.  The previous near-white tint made reflected
        // paving look like a flat cyan decal in the hub screenshot. A narrow
        // sun glint restores the high-frequency highlight that real water
        // picks up without painting a second static reflection.
        vec3 capturedWater=reflectedColor*vec3(0.62,0.86,0.94)*1.08;
        vec3 sunVector=normalize(vec3(-0.48,0.78,0.4));
        vec3 reflectedView=reflect(-viewDirection,normalize(vWorldNormal));
        float sunGlint=pow(max(0.0,dot(reflectedView,sunVector)),64.0)*0.4;
        vec3 water=mix(base,capturedWater,reflectionWeight)
          +vec3(0.06,0.28,0.32)*broadWave
          +vec3(0.03,0.13,0.17)*crossWave
          +vec3(0.70,0.94,0.90)*shimmer
          +vec3(1.0,0.78,0.48)*sunGlint;
        gl_FragColor=vec4(water,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`},l=[],u=3,d=(e,t,n,i)=>{let a=new tt(e,{textureWidth:n,textureHeight:n,clipBias:.003,multisample:0,color:10148818,shader:o});a.name=i,(Array.isArray(a.material)?a.material:[a.material]).forEach(e=>{e.depthWrite=!1,e.depthTest=!0}),a.position.set(...t),a.rotation.x=-Math.PI/2,a.renderOrder=1;let s=a.onBeforeRender,c=0;return a.onBeforeRender=(...e)=>{c++,c%u===0&&s.apply(a,e)},l.push(a),r.add(a),a},f=d(a,n,768,`Live scene reflection · central lagoon`),p=[n[0]-87,n[1]+.8,n[2]+18],m=new c(12.7,64);t.geometries.add(m);let h=d(m,p,384,`Live scene reflection · arrival garden court`),_=Je(.2),v=Je(3.4);t.textures.add(_).add(v);let y=new Te({color:3904155,emissive:534573,emissiveIntensity:.08,roughness:.07,metalness:.04,transmission:.14,clearcoat:1,clearcoatRoughness:.06,normalMap:_,normalScale:new O(.12,.12),side:2,transparent:!0,opacity:.34,depthWrite:!1,depthTest:!0,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1});t.materials.add(y),_.wrapS=_.wrapT=v.wrapS=v.wrapT=ge,_.repeat.set(2.8,1.7),v.repeat.set(4.2,2.5);let b=new F(a,y);b.name=`Animated lagoon surface normals and fresnel tint`,b.position.copy(f.position),b.rotation.copy(f.rotation),b.renderOrder=2,r.add(b);let x=y.clone();x.color.set(1400170),x.opacity=.32,t.materials.add(x);let S=new R({color:1466221,emissive:404020,emissiveIntensity:.18,roughness:.2,metalness:.12});t.materials.add(S);let C=new F(m,S);C.name=`Arrival court visible water depth`,C.position.set(p[0],p[1]-.055,p[2]),C.rotation.x=-Math.PI/2,C.renderOrder=0,r.add(C);let w=new F(m,x);w.name=`Animated arrival court normals and fresnel tint`,w.position.set(...p),w.rotation.x=-Math.PI/2,w.renderOrder=2,r.add(w);let T=new R({color:2379602,roughness:.98,metalness:.02});t.materials.add(T);let E=new F(a,T);E.name=`Lagoon recessed dark basin`,E.position.set(n[0],n[1]-.36,n[2]),E.rotation.copy(f.rotation),E.renderOrder=0,r.add(E);let D=new R({color:4811878,roughness:.76,metalness:.18});t.materials.add(D);let k=new F(new B(1,.055,8,128),D);t.geometries.add(k.geometry),k.name=`Lagoon carved stone shoreline`,k.position.set(n[0],n[1]+.04,n[2]),k.rotation.x=Math.PI/2,k.scale.set(112.7,68.6,1),k.castShadow=k.receiveShadow=!0,r.add(k);let ee=new R({color:12054244,emissive:3969932,emissiveIntensity:.22,roughness:.24,transparent:!0,opacity:.42,depthWrite:!1});t.materials.add(ee);let A=new F(new B(1,.018,6,128),ee);t.geometries.add(A.geometry),A.name=`Lagoon thin foam waterline`,A.position.set(n[0],n[1]+.12,n[2]),A.rotation.x=Math.PI/2,A.scale.set(110.86,67.48,1),A.renderOrder=4,r.add(A);let ne=new R({color:10479324,emissive:3913389,emissiveIntensity:.8,roughness:.16,metalness:.12,transparent:!0,opacity:.58,depthWrite:!1});t.materials.add(ne);let j=[],re=[];for(let e=0;e<8;e++){let i=new F(new B(2.8+e%3*.55,.11,8,32),ne);t.geometries.add(i.geometry);let a=e/8*Math.PI*2;i.position.set(n[0]+Math.cos(a)*(30+e%2*28),n[1]+.13,n[2]+Math.sin(a)*(15+e%3*16)),i.rotation.x=Math.PI/2,i.userData.phase=e*.81,i.userData.baseScale=.7+e%3*.15,i.renderOrder=3,i.castShadow=!1,i.receiveShadow=!1,r.add(i),j.push(i)}for(let e=0;e<4;e++){let n=new F(new B(1.9+e%2*.55,.085,8,28),ne);t.geometries.add(n.geometry);let i=e/4*Math.PI*2+.3;n.position.set(p[0]+Math.cos(i)*(3.2+e%2*2.1),p[1]+.11,p[2]+Math.sin(i)*(2.4+e%2*1.8)),n.rotation.x=Math.PI/2,n.userData.phase=1.6+e*.71,n.userData.baseScale=.56+e%2*.12,n.renderOrder=3,n.castShadow=!1,n.receiveShadow=!1,r.add(n),re.push(n)}let ie=new R({color:5211236,roughness:.78,metalness:.03}),ae=new R({color:16176804,emissive:9195320,emissiveIntensity:.22,roughness:.34});t.materials.add(ie).add(ae);let oe=[];for(let e=0;e<7;e++){let i=e/7*Math.PI*2+.22,a=new F(new z(2+e%2*.36,2.15,.1,18,1,!1,.22,Math.PI*1.78),ie);if(t.geometries.add(a.geometry),a.position.set(n[0]+Math.cos(i)*(22+e%3*22),n[1]+.24,n[2]+Math.sin(i)*(13+e%2*18)),a.scale.set(1+e%2*.22,1,.72+e%3*.08),a.rotation.y=i+.7,a.userData.phase=e*.74,a.userData.baseY=a.position.y,a.renderOrder=3,r.add(a),oe.push(a),e%2==0){let n=new F(new U(.48,12,8),ae);t.geometries.add(n.geometry),n.position.set(a.position.x,a.position.y+.48,a.position.z),n.scale.set(1.1,.5,1.1),n.userData.phase=e*.74+.4,n.userData.baseY=n.position.y,n.renderOrder=4,r.add(n),oe.push(n)}}let se=new R({color:7109749,roughness:.86,metalness:.08}),N=new Te({color:7592406,emissive:1531489,emissiveIntensity:.24,roughness:.12,metalness:.06,transmission:.18,transparent:!0,opacity:.58,side:2,depthWrite:!1});t.materials.add(se).add(N);let ce=new M;ce.name=`Lagoon floating garden fountain and lilies`,ce.position.set(n[0]-6,n[1]+.22,n[2]+4),r.add(ce);let le=new F(new z(3.9,4.4,.7,24),se);t.geometries.add(le.geometry),le.position.y=-.02,ce.add(le);let ue=new F(new B(3.6,.22,8,32),N);t.geometries.add(ue.geometry),ue.rotation.x=Math.PI/2,ue.position.y=.42,ce.add(ue);let de=[];for(let e=0;e<3;e++){let n=new F(new P(1.35,4.8,4,10),N);t.geometries.add(n.geometry),n.position.set(Math.cos(e/3*Math.PI*2)*.85,2.7,Math.sin(e/3*Math.PI*2)*.85),n.rotation.y=e/3*Math.PI*2,n.userData.phase=e*.95,n.renderOrder=4,ce.add(n),de.push(n)}let fe=new R({color:7832186,roughness:.94,metalness:.04});t.materials.add(fe);for(let e=0;e<11;e++){let i=-Math.PI*.25+e/10*Math.PI*.5,a=new F(new g(1.35+e%3*.28,1),fe);t.geometries.add(a.geometry),a.position.set(n[0]+230*.43*Math.cos(i),n[1]+.34,n[2]+Math.sin(i)*53.2),a.scale.set(1.2,.35,.85),a.castShadow=a.receiveShadow=!0,r.add(a)}return{update(e){r.visible&&(_.offset.set(e*.006,e*.002),v.offset.set(-e*.004,e*.005),l.forEach(t=>{(Array.isArray(t.material)?t.material:[t.material]).forEach(t=>{t instanceof Pe&&t.uniforms.time&&(t.uniforms.time.value=e)})}),j.forEach(t=>{let n=t.userData.phase,r=t.userData.baseScale,i=.86+Math.sin(e*1.3+n)*.2;t.scale.set(r*i,r*i,r*i),t.material=ne}),re.forEach(t=>{let n=t.userData.phase,r=t.userData.baseScale,i=.92+Math.sin(e*1.15+n)*.14;t.scale.set(r*i,r*i,r*i),t.material=ne}),oe.forEach(t=>{let n=t.userData.phase;t.position.y=t.userData.baseY+Math.sin(e*.9+n)*.045,t.rotation.z=Math.sin(e*.22+n)*.035}),de.forEach(t=>{let n=t.userData.phase,r=.9+Math.sin(e*2+n)*.1;t.scale.set(.8+r*.18,r,1),t.rotation.z=Math.sin(e*1.3+n)*.04}))},setQuality(e,t){let n=e?t?512:768:256,r=e?t?256:384:128;f.getRenderTarget().setSize(n,n),h.getRenderTarget().setSize(r,r),y.opacity=e?t?.19:.24:.12,x.opacity=e?t?.24:.32:.18,u=e?t?5:4:8},setVisible(e){r.visible=e},dispose(){l.forEach(e=>e.dispose()),r.removeFromParent(),r.clear()}}}var tn=Math.PI*2;function Q(e,t){let n=Math.sin(e*12.9898+t*78.233)*43758.5453;return n-Math.floor(n)}function nn(e,t,r,i,a=new H){e.setMatrixAt(t,new n().compose(r,a,i))}function rn(e,t){return e.add(t),t}function an(e,t,n,r,i,a,o,s,c){let l=pe(i,a,o,768,192);r.add(l);let u=new Oe({map:l,transparent:!0,depthWrite:!1,toneMapped:!1});n.add(u);let d=new F(new P(...c),u);return t.add(d.geometry),d.position.set(...s),d.name=`Floating world sign · ${i}`,e.add(d),d}function on(e){return e===`jungle`?8306024:e===`water`?5682884:e===`volcanic`?12808021:e===`mechanical`?12097118:e===`castle`?13218685:11113840}function sn(e,t){return e.add(t),t}function $(e,t,n,r,i,a,o){t.add(n);let s=I(e,n,r,i,a);return o&&s.rotation.set(...o),s}function cn(e,t,n){(e.userData.dynamics??=[]).push({mesh:t,rate:n})}function ln(e,t,n,r,i,a,o,s,c){let l=new M;l.name=`Central park visitor amenities and garden court`,e.add(l);let u=K[0],d=K[2],f=sn(n,s.clone());f.color.set(7228722),f.roughness=.82;let p=sn(n,new R({color:3824470,roughness:.38,metalness:.76})),m=sn(n,new R({color:13871706,emissive:7225883,emissiveIntensity:.24,roughness:.34,metalness:.62})),h=sn(n,new R({color:16764792,emissive:16749117,emissiveIntensity:2.2,roughness:.22,metalness:.15})),_=sn(n,new R({color:10849643,roughness:.82,metalness:.08})),v=sn(n,i.clone());v.color.set(12166780),v.roughness=.88;let b=sn(n,a.clone());b.color.set(4811618),b.roughness=.62,b.metalness=.42;let x=sn(n,new R({color:9360848,emissive:1731947,emissiveIntensity:.58,roughness:.16,metalness:.28,transparent:!0,opacity:.68})),S=sn(n,new R({color:1457472,emissive:1932402,emissiveIntensity:.34,roughness:.38,metalness:.2})),C=sn(n,new R({color:15251563,emissive:16751679,emissiveIntensity:1.5,roughness:.26,metalness:.12})),w=sn(n,new R({color:2972504,roughness:.28,metalness:.78})),T=(e,n,r,i,a)=>$(l,t,e,n,r,i,a);[0,Math.PI*.5,Math.PI,Math.PI*1.5,Math.PI*.25,Math.PI*.75,Math.PI*1.25,Math.PI*1.75].forEach((e,t)=>{let n=t>=4,r=n?6.2:9.6,i=n?96:124,a=i*.5,o=Math.sin(e),s=Math.cos(e),c=Math.cos(e),l=-Math.sin(e);T(L(r,.1,i,.1),v,[u+o*a,G+.18,d+s*a],void 0,[0,e,0]);for(let t of[-1,1])T(L(.16,.08,i-2.5,.04),b,[u+o*a+c*(r*.5-.44)*t,G+.27,d+s*a+l*(r*.5-.44)*t],void 0,[0,e,0])}),T(new z(25.5,25.5,.12,64),v,[u,G+.12,d]);for(let e of[12,20,25.2])T(new B(e,e===25.2?.34:.18,8,96),e===20?m:b,[u,G+.25,d],void 0,[Math.PI/2,0,0]);for(let e=0;e<4;e++){let t=e*Math.PI*.5+Math.PI*.25,n=Math.cos(t),r=Math.sin(t),a=-r,o=n,s=u+n*78,l=d+r*78,g=t+Math.PI/2;T(new z(5.9,6.5,.28,24),_,[s,G+.22,l]);for(let e of[-1,1]){let t=s+a*e*4.4,n=l+o*e*4.4;T(L(.62,5.8,.62,.1),f,[t,G+3.1,n]),T(new V(.62,1),m,[t,G+6.05,n],[1.15,.42,1.15])}T(L(10.8,.58,7.4,.16),f,[s,G+6.18,l],void 0,[0,g,0]),T(L(9,.22,5.7,.06),m,[s,G+6.5,l],void 0,[0,g,0]),T(L(6.8,.42,.68,.1),i,[s-n*1.7,G+1.05,l-r*1.7],void 0,[0,g,0]),T(new z(.34,.42,2.8,12),p,[s+n*2.6,G+1.55,l+r*2.6]),T(new U(.42,14,10),h,[s+n*2.6,G+3.15,l+r*2.6]);for(let e of[-1,1]){let t=s+a*e*5.1-n*.8,u=l+o*e*5.1-r*.8;T(new z(.82,1.08,.9,12),i,[t,G+.68,u]),T(new y(1.35,2),c,[t,G+2.05,u],[1.18,.78,1.18])}}let E=u-42,D=d-42;T(new z(8.2,9.2,.42,32),i,[E,G+.42,D]),T(new z(6.8,7.2,.18,32),p,[E,G+.72,D]);for(let e of[-1,1])T(L(.48,4.5,.48,.08),f,[E+e*5.6,G+2.8,D]),T(L(.48,4.5,.48,.08),f,[E,G+2.8,D+e*5.6]);T(L(12.8,.45,12.8,.24),f,[E,G+5.2,D],void 0,[0,Math.PI*.25,0]),T(new V(1.1,1),h,[E,G+3.8,D],[1.4,.58,1.4]),an(l,t,n,r,`園區總覽 · 入口導覽`,`#fff5d2`,`#315a52`,[E,G+6.25,D-6.5],[8.8,1.3]);let O=d-35,k=O-6;for(let e of[-17,17])T(L(11.8,4.4,1.2,.16),a,[u+e,G+2.45,k]);T(L(20.8,3.9,.18,.04),x,[u,G+2.78,k+.66]),T(L(18.4,3.05,.4,.06),S,[u,G+2.88,k-1.12]);for(let e of[-6.8,-2.3,2.3,6.8])T(L(2.5,1.18,.08,.02),C,[u+e,G+3.18,k-.9]),T(L(2.1,.1,.1,.02),w,[u+e,G+2.56,k-.82]);T(new z(2.15,2.15,.14,32),w,[u,G+4,k-.84],void 0,[Math.PI/2,0,0]),T(new z(1.72,1.72,.16,32),C,[u,G+4,k-.72],void 0,[Math.PI/2,0,0]),T(L(12,.6,2,.08),f,[u,G+1.52,k+.16]),T(L(10.6,.12,.18,.02),C,[u,G+1.88,k+.66]),T(L(7.8,1.85,.12,.02),x,[u,G+4,k+1.06]);for(let e of[-9.4,-4.7,0,4.7,9.4])T(L(.16,3.75,.28,.03),w,[u+e,G+2.82,k+.78]);for(let e of[-7,0,7])T(new z(.3,.38,1.7,12),w,[u+e,G+4.42,k-.9]),T(new U(.43,14,10),C,[u+e,G+3.58,k-.9]);T(L(50,.5,7.4,.16),f,[u,G+5,k+1.1]),T(L(46.5,.16,7,.06),m,[u,G+5.32,k+1.1]);for(let e of[-19,-11.5,11.5,19])T(L(.72,4.5,.72,.08),i,[u+e,G+2.55,k+.7]),T(new U(.4,14,10),h,[u+e,G+5,k+.55]);for(let e of[-15.5,-7.5,7.5,15.5])T(L(5,2.05,.14,.04),x,[u+e,G+2.85,k+.7]),T(L(5.2,.12,.22,.03),m,[u+e,G+3.95,k+.58]);for(let e of[-17,17])T(L(11.5,2.65,4.2,.14),a,[u+e,G+6.28,k]),T(L(9.2,1.75,.16,.04),x,[u+e,G+6.38,k-2.16]),T(L(10,.16,4.55,.05),m,[u+e,G+7.68,k]);T(L(15.2,2.05,.16,.04),x,[u,G+6.45,k-2.08]);for(let e of[-12,-6,0,6,12])T(L(.18,2.55,.28,.03),w,[u+e,G+6.25,k-2.18]),T(L(2.1,.1,.18,.02),C,[u+e,G+6.12,k-2.3]);T(L(41,.48,5.7,.12),f,[u,G+7.88,k+.06]),T(L(43.5,.16,6,.05),m,[u,G+8.18,k+.06]);for(let e of[-1,1])T(L(20.5,.28,.46,.05),w,[u+e*8.1,G+8.46,k+.12],void 0,[0,0,e*.18]);T(L(7.2,3.1,.18,.04),b,[u,G+2.4,k+.9]),T(L(8.2,.22,.26,.04),m,[u,G+4,k+.86]);for(let e=0;e<4;e++){let t=e*Math.PI*.5+Math.PI*.25,n=u+Math.sin(t)*42,r=d+Math.cos(t)*42;T(L(6.6,.42,1,.08),f,[n,G+1.35,r],void 0,[0,t,0]);for(let e of[-1,1])T(L(.42,1,.42,.06),a,[n+Math.cos(t)*e*2.3,G+.72,r-Math.sin(t)*e*2.3]);T(new z(.22,.3,3,12),p,[n+Math.cos(t)*4.3,G+1.65,r-Math.sin(t)*4.3]),T(new U(.38,14,10),h,[n+Math.cos(t)*4.3,G+3.35,r-Math.sin(t)*4.3])}for(let e of[-1,1])T(L(1.1,7,1.1,.16),i,[u+e*15.5,G+3.7,O]),T(new V(.78,1),m,[u+e*15.5,G+7.5,O],[1.2,.48,1.2]),T(new U(.46,14,10),h,[u+e*15.5,G+6.25,O-.65]);T(L(33,.75,1.2,.14),i,[u,G+6.45,O]),T(L(30,.18,1.42,.05),m,[u,G+6.92,O]);let ee=u+28,A=d-22;T(new z(13.5,15.2,.36,48),i,[ee,G+.3,A]),T(new B(12.7,.34,8,64),m,[ee,G+.52,A],void 0,[Math.PI/2,0,0]),T(new z(1.35,1.7,2.8,18),a,[ee,G+1.95,A]),T(new V(1.25,1),h,[ee,G+3.85,A],[1.4,.66,1.4]);for(let e=0;e<4;e++){let t=Math.PI*.25+e*Math.PI*.5,n=ee+Math.cos(t)*11.8,r=A+Math.sin(t)*11.8;T(new z(.55,.72,.72,12),i,[n,G+.72,r]),T(new y(.82,1),c,[n,G+1.7,r],[1.15,.7,1.15])}for(let e of[-1,1]){let t=u+e*34,n=d-18;T(L(14.5,.36,6.2,.16),i,[t,G+.3,n],void 0,[0,e*.12,0]),T(L(12.8,.22,4.7,.08),b,[t,G+.58,n],void 0,[0,e*.12,0]);for(let e of[-4.4,0,4.4])T(new z(.66,.82,.76,14),i,[t+e,G+.9,n]),T(new y(1.55,2),c,[t+e,G+2.45,n],[1.15,.92,1.15]);T(L(8,.42,.96,.08),f,[t,G+1.35,n+4.4],void 0,[0,e*.12,0]),T(new z(.22,.3,2.9,12),p,[t+e*6.5,G+1.65,n-1.4]),T(new U(.42,14,10),h,[t+e*6.5,G+3.35,n-1.4])}for(let e of[-1,1]){let t=u+e*43,n=d-10;T(L(26,.18,11,.1),i,[t,G+.42,n],void 0,[0,e*.08,0]),T(L(23.5,.28,8.5,.12),o,[t,G+.66,n],void 0,[0,e*.08,0]);for(let e of[-7.4,0,7.4])T(new z(.62,.84,.72,12),i,[t+e,G+1.14,n]),T(new y(1.45,2),c,[t+e,G+2.45,n],[1.16,.82,1.16])}for(let e of[-1,1]){let t=u+e*70,n=d-42;T(L(34,.24,19,.12),o,[t,G+.37,n],void 0,[0,e*.08,0]),T(L(36.5,.18,21.5,.08),i,[t,G+.16,n],void 0,[0,e*.08,0]);for(let e of[-11,0,11])T(new z(.78,1.05,.82,14),i,[t+e,G+.85,n]),T(new y(1.7,2),c,[t+e,G+2.35,n],[1.2,.9,1.2]);for(let r of[-6.8,6.8])T(new g(1.15,1),i,[t+e*12.6,G+1.1,n+r],[1.35,1.1,.9],[.1,e*.22,.05]),T(new z(.2,.28,2.7,10),p,[t-e*12.6,G+1.55,n+r]),T(new U(.42,14,10),h,[t-e*12.6,G+3.2,n+r])}return l}function un(e,t,n,i,a,o,s){let c=new M;c.name=`Floating attraction theme set · ${a.publicName}`,c.position.set(a.entry[0],a.isCastle?a.entry[1]:G,a.entry[2]),e.add(c),$t(c,{geometries:t,materials:n,textures:i},a,s);let l=sn(n,new R({color:a.color,emissive:a.color,emissiveIntensity:.14,roughness:.46,metalness:.22})),u=new W(4.5,.32,7.5);for(let e of[-1,1]){$(c,t,u,o.stone,[e*11,.18,1.2]);let n=$(c,t,new z(.34,.48,5.2,10),o.stone,[e*11,2.75,.2]),r=$(c,t,new V(.72,1),l,[e*11,5.7,.2],[1,1.25,1]);cn(c,r,e*.28),n.castShadow=r.castShadow=!0}let d=c.children.length,f=(e,n,r,i)=>$(c,t,e,o.stone,n,r,i),p=(e,n,r,i)=>$(c,t,e,l,n,r,i);switch(a.pattern){case`gate`:for(let e of[-1,1])f(new W(2.4,8,2.4),[e*5.5,4,-1]),p(new B(3.7,.32,10,28,Math.PI),[0,6.9,-1],[1,1,1],[0,0,0]);break;case`waterfall`:{let e=$(c,t,new P(8,13,10,18),o.water,[-10.5,6.5,-1],[1,1,1],[0,0,Math.PI/2]);e.rotation.set(0,Math.PI,0),cn(c,e,.34),$(c,t,new z(5.8,6.3,.28,32),o.water,[-10.5,.3,-1]),p(new B(5.9,.22,8,32),[-10.5,.48,-1]);break}case`boulder`:for(let[e,t,n,r]of[[-11,2.1,-1,2.1],[11,2.8,2,2.7],[-10,1.5,3,1.7]])f(new g(1,1),[e,t,n],[r,r*.86,r],[.14,.4,.22]);break;case`bridge`:for(let e of[-1,1]){f(new z(.36,.5,7,10),[e*11,3.5,-1]);let t=p(new z(.1,.1,13,8),[e*11,5.8,-1],[1,1,1],[Math.PI/2,0,0]);t.rotation.z=Math.PI/2}p(new B(4,.16,8,28),[0,3.6,-1],[1,1,1],[Math.PI/2,0,0]);break;case`temple`:cn(c,p(new z(3.3,3.3,.45,32),[0,5.6,-1],[1,1,1],[Math.PI/2,0,0]),.22);for(let e of[-1,1])f(new z(.7,.95,6,14),[e*5,3,-1]);break;case`vine`:for(let e of[-1,1])cn(c,p(new B(3.6,.22,10,32),[e*8,4.2,-1],[1,1,1],[Math.PI/2,0,0]),e*.32),f(new z(.5,.85,8,10),[e*8,4,-1]);break;case`water`:for(let e of[-1,1])cn(c,$(c,t,new W(8,.18,7),o.water,[e*8,.18,-1]),.18),p(new B(3.2,.18,8,24),[e*8,.38,-1]);break;case`maze`:for(let e of[-1,1])f(new W(4,4.6,1.2),[e*9,2.3,-2]),f(new W(2.5,3.1,1.2),[e*4.5,1.55,2.5]);p(new V(1,1),[0,5.8,-1],[1.6,1.6,1.6]);break;case`volcano`:for(let e of[-1,1]){f(new r(2.5,6.5,8),[e*8.5,3.25,-1]);let t=p(new z(1.3,1.3,.12,20),[e*8.5,6.55,-1]);t.material=sn(n,new R({color:16742973,emissive:16727074,emissiveIntensity:2.3})),cn(c,t,e*.45)}break;case`statue`:for(let e of[-1,1])f(new W(2.8,6,2.4),[e*8,3,-1]),p(new U(1.15,18,12),[e*8,7,-1]),p(new r(.7,2.3,6),[e*8,8.3,-1],[1,1,1],[0,0,Math.PI]);break;case`mine`:for(let e of[-1,1]){let t=p(new z(.12,.12,14,8),[e*2.2,.55,-1],[1,1,1],[Math.PI/2,0,0]);t.rotation.x=Math.PI/2}f(new W(4.2,1.8,3.4),[0,1.45,-1]),p(new B(1.7,.18,8,24),[0,1.6,-2.75],[1,1,1],[Math.PI/2,0,0]);break;case`tree`:f(new z(1.8,2.8,9,12),[0,4.5,-1]),p(new y(4.8,1),[0,10,-1],[1.2,1.05,1.2]);for(let e of[-1,1])p(new U(1.6,16,10),[e*4.2,7.2,-1]);break;case`observatory`:cn(c,p(new B(4.2,.32,10,36),[0,5.7,-1]),.38),f(new z(.85,1.1,8,14),[0,4,-1]),p(new U(1.8,24,16),[0,5.7,-1],[1.8,.65,1.8]);break;case`cave`:f(new U(5.6,18,12),[0,4.3,-1],[1.25,.92,.78]),cn(c,$(c,t,new z(2.5,2.8,.28,24),o.dark,[0,2.2,-5.35],[1,1,1],[Math.PI/2,0,0]),.16);break;case`canal`:$(c,t,new W(12,.18,7),o.water,[0,.2,-1]);for(let e of[-1,1])f(new W(2,3.8,8),[e*7,1.9,-1]);p(new B(3.2,.2,8,28),[0,.42,-1]);break;case`beast`:f(new W(5,4.5,4),[0,3,-1]),p(new U(2.5,20,14),[0,6.3,-1],[1.15,.9,1]);for(let e of[-1,1])p(new r(.65,3.2,8),[e*2.1,8,-1],[1,1,1],[0,0,e*.28]);break;case`harbor`:f(new W(12,.45,5),[0,.35,-1]);for(let e of[-1,1]){let t=p(new z(.18,.24,10,8),[e*5,5,-1]),n=p(new P(4,5),[e*5,5.1,-1.1]);n.rotation.y=e*.22,cn(c,t,e*.2)}break;case`construction`:for(let e of[-1,1])f(new W(1.2,10,1.2),[e*7,5,-1]);p(new W(17,.9,.9),[0,9.5,-1]),cn(c,p(new z(.16,.16,4,8),[3,7.4,-1]),.42);break;case`finale`:p(new B(5.5,.38,12,40),[0,6.5,-1]),p(new y(1.3,1),[-7,5.5,-1]),p(new y(1.3,1),[7,5.5,-1]);for(let e of[-1,1])cn(c,p(new P(2.2,4.5,2,3),[e*8,5.5,-1]),e*.3);break;case`castle`:f(new W(7,8,5),[0,4,-1]),p(new r(3.5,7,8),[0,11.5,-1])}let m=new M;m.name=`Playable mechanism preview court · ${a.publicName}`,m.position.set(a.id.length%2?25:-25,0,.5);for(let e of c.children.slice(d))e.removeFromParent(),m.add(e);return c.add(m),c.userData.attractionId=a.id,c}function dn(e,t,n,r,i,a,o){let s=K[0],c=K[2],l=new M;l.name=`Central park wayfinding ring`,e.add(l);for(let e=0;e<i.length;e++){let u=i[e],d=e/i.length*tn-Math.PI/2,f=s+Math.cos(d)*102,p=c+Math.sin(d)*102,m=$(l,t,new z(.24,.34,4.8,8),o,[f,G+2.4,p]);m.castShadow=!0;let h=$(l,t,new V(.9,1),a,[f,G+5.25,p]);h.material=sn(n,new R({color:u.color,emissive:u.color,emissiveIntensity:.42,roughness:.34,metalness:.32})),an(l,t,n,r,u.publicName,`#fff8df`,`#${on(u.zone).toString(16).padStart(6,`0`)}`,[f,G+8.1,p],[8.5,1.35]).lookAt(s,G+8.1,c)}let u=$(l,t,new z(.75,1.05,.16,64),a,[s,G+.34,c]);u.name=`Central park compass inlay`,u.receiveShadow=!0;for(let e of[0,Math.PI/2,Math.PI,Math.PI*3/2]){let n=$(l,t,new W(.14,.1,1.6),a,[s,G+.47,c],[1,1,1],[0,e,0]);n.name=`Central park compass spoke`,n.receiveShadow=!0}return an(l,t,n,r,`20 座設施總覽 · M 快捷傳送`,`#fff6d8`,`#2d514b`,[s,G+13.2,c-20],[18,2.9]),an(l,t,n,r,`遠眺浮游城 ↖`,`#fff6d8`,`#705437`,[s-55,G+5.6,c-55],[10,1.8]),l}function fn(e,t,n){let i=K[0],a=K[2],o=new O(-1,-1).normalize(),s=Math.atan2(o.x,o.y),c=new M;c.name=`Floating City distant lookout`,c.position.set(i+o.x*68,G,a+o.y*68),c.rotation.y=s,e.add(c);let l=sn(n,new R({color:13941100,emissive:9198634,emissiveIntensity:.34,roughness:.38,metalness:.66})),u=sn(n,new R({color:9404523,roughness:.92}));$(c,t,new z(18,22,.5,40),u,[0,.42,0]);let d=$(c,t,new B(18,1.1,12,56),l,[0,12,0]);d.castShadow=!0;for(let e of[-1,1])$(c,t,new z(1.15,1.65,12,12),u,[e*17,6,0]);let f=new M;f.name=`Distant Floating City silhouette`,f.position.set(i-780,G+150,a-760),e.add(f);let p=sn(n,new R({color:9282976,emissive:2575440,emissiveIntensity:.72,roughness:.56,metalness:.32,transparent:!0,opacity:.95})),m=sn(n,new Oe({color:15780728,transparent:!0,opacity:.82,toneMapped:!1})),h=$(f,t,new z(34,42,8,10),p,[0,0,0]);h.castShadow=!1;for(let[e,n,i,a]of[[-22,-13,42,7],[0,-4,64,10],[22,-14,48,8],[-10,18,34,6],[14,17,38,6]])$(f,t,new z(a*.72,a,i,8),p,[e,i/2+3,n]),$(f,t,new r(a*1.15,i*.26,8),p,[e,i+8,n]),$(f,t,new U(1.1,12,8),m,[e,i*.62,n-a*.78]);let g=$(f,t,new B(42,1.1,10,48),m,[0,12,0]);return g.rotation.x=Math.PI/2,c}function pn(e,t,n,i,a){let o=new M;o.name=`Floating park distant attraction skyline`,e.add(o);let s=new Map,c=new Map,l=sn(n,new Oe({color:16767115,transparent:!0,opacity:.78,toneMapped:!1})),u=sn(n,new R({color:1387569,roughness:.58,metalness:.24})),d=e=>{let t=s.get(e.id);if(t)return t;let r=e.zone===`jungle`?a.bark:e.zone===`volcanic`||e.zone===`mechanical`?a.rock:a.limestone,i=new T(on(e.zone));i.offsetHSL((e.color%17-8)/360,(e.color%11-5)/100,(e.color%13-6)/100);let o=sn(n,new R({color:i,map:r.map,normalMap:r.normalMap,roughnessMap:r.roughnessMap,normalScale:new O(e.zone===`jungle`?.42:.28,e.zone===`jungle`?.42:.28),roughness:.78,metalness:e.zone===`mechanical`?.58:.12}));return s.set(e.id,o),o},f=e=>{let t=c.get(e.id);if(t)return t;let r=e.zone===`jungle`?a.bark:e.zone===`volcanic`||e.zone===`mechanical`?a.rock:a.limestone,i=new T(e.zone===`jungle`?3563335:e.zone===`water`?2913399:e.zone===`volcanic`?4796984:e.zone===`mechanical`?4676180:6968891);i.offsetHSL((e.color%19-9)/360,.02,0);let o=sn(n,new R({color:i,map:r.map,normalMap:r.normalMap,roughnessMap:r.roughnessMap,normalScale:new O(.2,.2),roughness:.86,metalness:e.zone===`mechanical`?.62:.18}));return o.emissive.set(on(e.zone)),o.emissiveIntensity=.12,c.set(e.id,o),o},p=(e,n,r,i,a,o)=>{let s=$(e,t,n,r,i,a,o);return s.castShadow=!1,s.receiveShadow=!0,s},m=(e,t,n,i)=>{let a=(t,r)=>p(e,L(1,1,1,.12),n,t,r),o=(t,n)=>p(e,new r(1,1,6),i,t,n,[0,Math.PI/6,0]);switch(t.pattern){case`gate`:case`finale`:a([0,11.8,-1.5],[7.2,13.2,5.8]);for(let e of[-3.2,3.2])o([e,19.5,-1.5],[1.8,3.2,1.8]);break;case`temple`:a([0,16.4,0],[23,1.7,9.5]),a([0,18.1,0],[16.5,1.45,7]),p(e,new z(2.2,2.2,.55,20),l,[0,19.45,-4.8],[1.3,1,1.3],[Math.PI/2,0,0]);break;case`maze`:for(let e of[-8.5,8.5]){a([e,10.2,-7],[6,10,1.5]);for(let t of[-2,0,2])o([e+t,16,-7],[.8,2,.8])}a([0,8.8,6],[16,7.2,1.2]);break;case`statue`:case`beast`:for(let t of[-6.2,6.2])p(e,new g(2.7,1),n,[t,14.7,-1],[1.15,1.8,1]),o([t,18.3,-1],[1.25,2.4,1.25]);if(t.pattern===`beast`)for(let t of[-2,2])p(e,new r(.7,3.8,8),i,[t,17,-6.1],[1,1,1],[0,0,t<0?-.18:.18]);break;case`bridge`:a([0,17,0],[23,1.2,3]);for(let e of[-9.5,9.5])a([e,11.4,0],[1.7,11.5,1.7]),o([e,18.3,0],[1.7,2.7,1.7]);break;case`vine`:p(e,new z(2,2.8,17,12),n,[0,11.8,0]);for(let t of[9,13,17]){let n=p(e,new B(4.2,.32,8,28),i,[0,t,0]);n.rotation.x=Math.PI/2}break;case`tree`:p(e,new z(3.6,5,18,14),n,[0,11.5,0]),p(e,new U(7.8,16,10),i,[0,22,0],[1.35,.9,1.2]);break;case`waterfall`:for(let e of[-7,7])a([e,10.5,0],[4.2,12,5.4]);p(e,L(5.8,15,.28,.06),l,[0,9,-8.8]),a([0,2,-4.8],[22,1.2,7]);break;case`water`:case`canal`:a([0,12.2,0],[24,1.3,5.8]);for(let t of[-8.5,8.5])p(e,new B(3,.65,10,28,Math.PI),i,[t,8.7,-5.2],[1,1.1,1],[Math.PI/2,0,0]);p(e,L(16,.35,3.2,.04),l,[0,8,-5.4]);break;case`harbor`:a([0,1.2,-4.4],[27,1.5,7.2]);for(let t of[-8.5,8.5])p(e,new z(.42,.65,16,10),i,[t,9,-2]),p(e,new r(1,1,4),l,[t,10.5,-5],[4.2,6.2,.4],[0,0,t<0?-.08:.08]);break;case`volcano`:p(e,new r(1,1,10),n,[0,12.5,0],[10,18,10]),p(e,new z(2.2,2.2,.5,20),l,[0,21.6,0]);let s=p(e,new B(7.3,.34,8,32),l,[0,9.8,0]);s.rotation.x=Math.PI/2;break;case`mine`:for(let e of[-9,9])a([e,10.5,0],[1.1,12.8,1.1]);a([0,16,0],[20,1,1]),p(e,L(7,2.6,3.8,.12),i,[0,2.5,-5.2],[1,1,1],[0,.12,0]);break;case`observatory`:{p(e,new z(6,6.4,8.5,24),n,[0,7.6,0]),p(e,new U(5.9,20,12,0,tn,0,Math.PI/2),i,[0,12,0],[1,.8,1]);let t=p(e,L(.7,.7,11,.12),l,[0,16,-1.5],[1,1,1],[.28,0,-.26]);t.rotation.z=-.24;break}case`cave`:case`boulder`:for(let[t,r,i]of[[-8,11,1.2],[0,14,1.55],[8,10.2,1.3]])p(e,new g(4.1,1),n,[t,r,0],[i,i*1.18,i*.92]);t.pattern===`cave`&&p(e,L(8,4.5,.38,.12),l,[0,6,-8.4]);break;case`construction`:for(let e of[-9.5,9.5])a([e,11,0],[1.2,15,1.2]);a([0,18,0],[22,1,1]),p(e,new z(.24,.24,7.5,8),l,[3.6,11,-3]),p(e,L(5.5,.45,.45,.04),l,[0,14.7,-3],void 0,[0,0,.05])}},h=(e,t,n,i)=>{let a=L(1,1,1,.08),o=L(1,1,.12,.04),s=L(1,1,1,.06),c=L(1,1,1,.08),d=(t,n,r,i,a)=>p(e,t,n,r,i,a);for(let e of[2.25,4.45,6.65])for(let[t,r]of[[-13,6.2],[-6.2,4.2],[6.2,4.2],[13,6.2]])d(a,n,[t,e,9.15],[r,.07,.18]);d(c,i,[0,8.35,9],[27,.28,.42]),d(s,u,[0,4,9.18],[7.2,5.6,.12]),d(s,i,[-4.5,4.35,9.3],[.34,5.9,.3]),d(s,i,[4.5,4.35,9.3],[.34,5.9,.3]);for(let e of[-11.2,-7.2,7.2,11.2])d(o,l,[e,4.35,9.27],[2.7,1.85,1]),d(s,i,[e,3.35,9.34],[3,.12,.18]),d(s,i,[e,5.35,9.34],[3,.12,.18]);switch(t.pattern){case`gate`:case`finale`:for(let e of[-1,1])d(new z(.48,.58,7.2,10),i,[e*6,4.6,9.5],[1,1,1]),d(new r(.8,1.8,6),i,[e*6,9.2,9.5],[1,1,1]);break;case`temple`:for(let e of[-10,-5,5,10])d(new z(.32,.42,6.2,10),i,[e,4.8,9.55],[1,1,1]);d(new z(1.35,1.35,.18,20),l,[0,7.9,9.44],[1.4,1,1.4],[Math.PI/2,0,0]);break;case`bridge`:case`vine`:case`tree`:for(let e of[-1,1])d(s,i,[e*8.8,4.6,9.42],[.28,6.9,.28]),d(s,i,[e*4.4,7.5,9.42],[4.9,.24,.24],[0,0,e*.16]);break;case`waterfall`:d(L(4.3,5.6,.18,.05),l,[0,4.8,9.46],[1,1,1]);for(let e of[-1,1])d(s,n,[e*8.3,4.8,9.44],[.6,7.8,.6]);break;case`water`:case`canal`:case`harbor`:if(d(L(15.5,.22,.28,.04),l,[0,2.2,9.48],[1,1,1]),t.pattern===`harbor`)for(let e of[-1,1])d(new z(.18,.24,8.6,8),i,[e*8.7,5.1,9.3],[1,1,1]);break;case`volcano`:for(let e of[-1,1])d(L(.16,2.4,.1,.02),l,[e*5,4.8,9.46],[1,1,1],[0,0,e*.16]);break;case`mine`:case`construction`:for(let e of[-1,1])d(s,i,[e*7.7,5,9.45],[.3,8.2,.3]);d(s,i,[0,8.55,9.45],[16,.3,.3]);break;case`observatory`:{let e=d(new B(3.4,.24,8,28),i,[0,6.8,9.5],[1,.72,1]);e.rotation.x=Math.PI/2;break}case`cave`:case`boulder`:{let e=d(new B(3.8,.62,10,28,Math.PI),n,[0,5.4,9.42],[1.35,1.1,1]);e.rotation.y=Math.PI;break}}},_=i.filter(e=>!e.isCastle),v=K[0],y=K[2];return _.forEach((e,n)=>{let i=new M;i.name=`Distant park landmark · ${e.publicName}`;let a=-Math.PI*.5+n/_.length*tn,s=230+n%3*28,c=v+Math.cos(a)*s,u=y+Math.sin(a)*s;i.position.set(c,G,u),i.rotation.y=Math.atan2(v-c,y-u);let g=d(e),b=f(e),x=(e,n,r,a,o)=>{let s=$(i,t,e,n,r,a,o);return s.userData.skylineShadowCaster=!0,s};x(L(34,10,21,.32),g,[0,5,0]);for(let e of[-1,1])x(L(5.2,16,5.2,.18),g,[e*12,8,0]),x(new r(1,1,4),b,[e*12,16.8,0],[3,1.25,3],[0,Math.PI/4,0]);x(new r(1,1,e.zone===`mechanical`?4:6),b,[0,15.8,0],[17.2,7.4,11.6],[0,Math.PI/4,0]),$(i,t,new V(.85,1),l,[0,23,0],[1.2,1.8,1.2]);for(let e of[-9,-3,3,9])$(i,t,L(2.2,2,.12,.03),l,[e,5,10.65]);e.zone===`water`?$(i,t,L(36,.24,1.2,.05),l,[0,9.9,10.4]):e.zone===`volcanic`&&p(i,new z(.9,1.1,6.4,10),l,[0,11.8,-1.5]),m(i,e,g,b),h(i,e,g,b),i.traverse(e=>{e instanceof F&&(e.castShadow=e.userData.skylineShadowCaster===!0,e.receiveShadow=!0)}),p(i,L(38,.28,5.6,.08),b,[0,.22,12.55]),p(i,L(34,.24,2.6,.06),g,[0,.5,14]);for(let e of[-15.2,15.2])p(i,new z(.58,.72,7.4,12),g,[e,4.15,11.3]),p(i,L(2,.32,1.7,.06),b,[e,7.95,11.3]);p(i,L(32,.72,1.15,.08),b,[0,8,11.3]);let S=p(i,new B(4.1,.22,8,28,Math.PI),b,[0,5.3,11.48]);S.rotation.y=Math.PI,o.add(i)}),o}function mn(){return[{kind:`ground`,p:[K[0],G-.65,K[2]],size:[620,1.3,600],color:9412227,surface:`stone`},{kind:`ground`,p:[K[0],G-.46,K[2]],size:[260,.28,260],color:11704426,surface:`stone`},{kind:`ground`,p:[1450,G-.65,1750],size:[900,1.3,1700],color:7179608,surface:`stone`}]}function hn(e){let t=new Set,n=new Set,r=new Set;e.traverse(e=>{e instanceof F&&(t.add(e.geometry),(Array.isArray(e.material)?e.material:[e.material]).forEach(e=>{n.add(e);for(let t of[`map`,`normalMap`,`roughnessMap`,`alphaMap`,`emissiveMap`]){let n=e[t];n instanceof l&&r.add(n)}}))}),e.removeFromParent(),r.forEach(e=>e.dispose()),n.forEach(e=>e.dispose()),t.forEach(e=>e.dispose())}function gn(e,t,n,r,i){let a=new M;a.name=`Floating attraction entrance · ${i.publicName}`,a.position.set(i.entry[0],i.entry[1],i.entry[2]-11),e.add(a);let o=new R({color:on(i.zone),roughness:.46,metalness:.16}),s=new R({color:i.isCastle?10132107:10128240,roughness:.88,metalness:.06}),c=new R({color:2440766,roughness:.42,metalness:.62});n.add(o).add(s).add(c);let l=rn(t,L(.68,3.45,.68,.12)),u=rn(t,L(1.05,.28,1.05,.08));for(let e of[-1,1]){I(a,l,s,[e*8.5,1.72,0]),I(a,u,o,[e*8.5,3.52,0]);let n=new F(rn(t,new B(.7,.09,8,22)),o);n.position.set(e*8.5,2.7,-.46),n.rotation.x=Math.PI/2,a.add(n)}let d=I(a,L(16,.52,.72,.12),s,[0,3.5,0]);d.castShadow=d.receiveShadow=!0;let f=I(a,new V(.72),o,[0,4.25,0],[1,1.35,1]);t.add(f.geometry);let p=I(a,L(10.5,1.18,.18,.12),c,[0,4.85,.12]);p.rotation.x=-.12,an(a,t,n,r,i.publicName,`#fff6d8`,`#${on(i.zone).toString(16).padStart(6,`0`)}`,[0,4.85,.24],[9.6,.86]);let m=new me(on(i.zone),i.isCastle?3.2:1.5,i.isCastle?26:15);m.position.set(0,1.9,1.2),a.add(m);let h=rn(t,new P(1.5,2.2,3,4)),g=new R({color:on(i.zone),roughness:.9,side:2});n.add(g);let _=new F(h,g);return _.position.set(0,4.55,-.04),_.name=`Animated flag · ${i.publicName}`,a.add(_),a.userData.attractionId=i.id,a.userData.flag=_,a}function _n(e,t,n){let i=new M;i.name=`Floating City · jungle and ancient ruins amusement park`,t.add(i);let a=new me(16761453,3,210,2);a.position.set(K[0]-22,G+16,K[2]+12),a.castShadow=!1,a.name=`Park plaza warm lantern fill`;let o=new me(6870995,2,180,2);o.position.set(K[0]+115,G+7,K[2]-40),o.castShadow=!1,o.name=`Lagoon turquoise bounce light`;let s=new f(10210786,.52);s.position.set(K[0]-360,G+280,K[2]+240),s.target.position.set(K[0],G,K[2]),s.castShadow=!1,s.name=`Park cool mountain rim light`;let c=new f(11066605,.42);c.position.set(K[0]-260,G+260,K[2]+320),c.target.position.set(K[0],G,K[2]),c.castShadow=!1,c.name=`Park broad cyan sky fill`,i.add(a,o,s,s.target,c,c.target);let l=new Set,u=new Set,d=new Set,m=new Map,h=e=>{let t=m.get(e);if(t)return t;let r=n.path.clone();return r.color.set(e),r.roughness=.82,r.normalScale.set(.62,.62),m.set(e,r),u.add(r),r},g={geometries:l,materials:u,textures:d},_=Be,b=mn(),x=_.filter(e=>!e.isCastle),S=b.map(n=>ce(e,t,{...n,surface:`stone`}));for(let e of S)e.visual.visible=!1;let C=[];for(let t of x){let n=new M;n.name=`Floating attraction route · ${t.publicName}`,i.add(n);let r=t.level.obstacles.map(r=>{let i=ce(e,n,{...r,surface:`stone`});return i.visual.material=h(r.color??t.color),i});S.push(...r),C.push({attraction:t,group:n})}let w=n.limestone.clone();w.color.set(13022343),w.roughness=.82;let E=n.bronze.clone();E.color.set(3165513),E.metalness=.72;let D=n.foliage.clone();D.color.set(5142856),D.roughness=1;let O=n.bark.clone();O.color.set(5982264);let k=n.foliage.clone();k.color.set(4158020),u.add(w).add(E).add(D).add(O).add(k);let A=n.grass.clone();A.color.set(7179608),A.roughness=.96,u.add(A);let ne=new te;ne.absarc(0,0,335,0,Math.PI*2,!1);let j=new fe;j.absellipse(115,40,115,70,0,Math.PI*2,!0,0),ne.holes.push(j);let re=new Ie(ne,{depth:.18,bevelEnabled:!1,curveSegments:96});re.rotateX(-Math.PI/2);let ie=new F(rn(l,re),A);ie.position.set(K[0],G-.12,K[2]),ie.receiveShadow=!0,ie.name=`High-detail jungle park island ground`,i.add(ie);let ae=new te;ae.moveTo(-430,-820),ae.lineTo(395,-820),ae.lineTo(448,-610),ae.lineTo(430,160),ae.lineTo(390,820),ae.lineTo(-320,850),ae.lineTo(-450,530),ae.lineTo(-452,-420),ae.closePath();let oe=new Ie(ae,{depth:.16,bevelEnabled:!0,bevelThickness:.08,bevelSize:.12,bevelSegments:2,curveSegments:8});oe.rotateX(-Math.PI/2);let se=new F(rn(l,oe),A);se.position.set(1450,G-.52,1750),se.receiveShadow=!0,se.name=`Continuous jungle terrain around attraction field`,i.add(se);let N=sn(u,w.clone());N.color.set(12166780),N.roughness=.86;let le=sn(u,E.clone());le.color.set(3560781),le.roughness=.68,le.metalness=.36;let ue=(e,t)=>{let n=new F(rn(l,new W(e[0]+1.4,.08,e[2]+1.4)),le);n.position.set(t[0],G-.045,t[2]),n.receiveShadow=!0,n.name=`Ancient park promenade edge`,i.add(n);let r=new F(rn(l,new W(...e)),N);r.position.set(t[0],G+.015,t[2]),r.receiveShadow=!0,r.name=`Ancient park promenade paving`,i.add(r)};ue([34,.12,1580],[1285,0,1750]);for(let e of[2470,1960,1450])ue([500,.12,26],[1540,0,e]);let de=new te;de.absarc(0,0,128,0,Math.PI*2,!1);let pe=new fe;pe.absellipse(115,40,115,70,0,Math.PI*2,!0,0),de.holes.push(pe);let I=new Ie(de,{depth:.35,bevelEnabled:!1,curveSegments:64});I.rotateX(-Math.PI/2);let he=new F(rn(l,I),w);he.position.set(K[0],G+.01,K[2]),he.receiveShadow=!0,he.name=`Central exploration plaza`,i.add(he);for(let e of[92,112]){let t=new F(rn(l,new B(e,.42,8,96)),E);t.rotation.x=Math.PI/2,t.position.set(K[0],G+.46,K[2]),i.add(t)}let ge=ln(i,l,u,d,w,E,D,O,k);an(i,l,u,d,`浮遊城遊樂園`,`#fff5d5`,`#264c47`,[K[0],G+10.35,K[2]-35],[16,3.1]),an(i,l,u,d,`按 M 開啟設施快捷線 · 走到入口按 E`,`#eaf8e4`,`#3b6e53`,[K[0],G+8.25,K[2]-35],[20,1.9]);let _e=_.map(e=>gn(i,l,u,d,e)),ve=dn(i,l,u,d,_,w,E),ye=en(i,g,[K[0]+115,G+.1,K[2]-40]),be=rn(l,new z(.22,.42,1,10)),xe=rn(l,new y(1,2)),Se=new v(be,O,320),Ce=new v(xe,k,320),we=rn(l,new r(1,1,8)),Ee=new v(we,D,560);Se.name=`Instanced jungle trunks`,Ce.name=`Instanced layered jungle crowns`,Ee.name=`Instanced jungle fern understory`,Se.castShadow=Ce.castShadow=!0,Se.receiveShadow=Ce.receiveShadow=!0,Ee.castShadow=!0,Ee.receiveShadow=!0,i.add(Se,Ce,Ee);let De=K[0],Oe=K[2],ke=0;for(let e=0;e<320;e++){let t=Q(e,4)*tn,n=112+Q(e,7)*1050,r=De+Math.cos(t)*n,i=Oe+Math.sin(t)*n;if(x.some(e=>Math.abs(r-e.spawn[0])<12&&i<e.spawn[2]+24&&i>e.level.finish[2]-24)||Math.abs(r-De)<95&&Math.abs(i-Oe)<95)continue;let a=9+Q(e,11)*13,o=.75+Q(e,13)*1.05;nn(Se,ke,new p(r,G+a*.34,i),new p(o,a*.72,o)),nn(Ce,ke,new p(r,G+a*.86,i),new p(a*.26,a*.32,a*.26),new H().setFromEuler(new ee(Q(e,17)*.2,Q(e,19)*tn,0))),Ce.setColorAt(ke,new T().setHSL(.26+Q(e,23)*.07,.32+Q(e,29)*.3,.25+Q(e,31)*.22)),ke++}Se.count=Ce.count=ke,Se.instanceMatrix.needsUpdate=Ce.instanceMatrix.needsUpdate=!0,Ce.instanceColor&&(Ce.instanceColor.needsUpdate=!0);let Ae=0;for(let e=0;e<560;e++){let t=Q(e,69)*tn,n=96+Q(e,73)*920,r=De+Math.cos(t)*n,i=Oe+Math.sin(t)*n;if(x.some(e=>Math.abs(r-e.spawn[0])<16&&i<e.spawn[2]+18&&i>e.level.finish[2]-18)||Math.abs(r-De)<92&&Math.abs(i-Oe)<92)continue;let a=1.2+Q(e,79)*2.8;nn(Ee,Ae,new p(r,G+a*.5,i),new p(.7+Q(e,83)*.7,a,.7+Q(e,89)*.7),new H().setFromEuler(new ee(0,Q(e,97)*tn,0))),Ee.setColorAt(Ae,new T().setHSL(.25+Q(e,101)*.08,.34+Q(e,103)*.3,.23+Q(e,107)*.2)),Ae++}Ee.count=Ae,Ee.instanceMatrix.needsUpdate=!0,Ee.instanceColor&&(Ee.instanceColor.needsUpdate=!0);let je=rn(l,L(2.3,4.5,2.3,.18)),Me=new v(je,w,96);Me.name=`Instanced ancient ruin fragments`,Me.castShadow=Me.receiveShadow=!0,i.add(Me);for(let e=0;e<Me.count;e++){let t=e/Me.count*tn+Q(e,41)*.18,n=145+Q(e,43)*120,r=1.5+Q(e,47)*5.5;nn(Me,e,new p(De+Math.cos(t)*n,G+r/2,Oe+Math.sin(t)*n),new p(.7+Q(e,49)*.75,r/4.5,.7+Q(e,53)*.75),new H().setFromEuler(new ee(0,Q(e,59)*tn,Q(e,61)*.12)))}Me.instanceMatrix.needsUpdate=!0;let Ne=new M;Ne.name=`Attraction checkpoint beacon details`,i.add(Ne);let U=rn(l,new V(.22,0)),Pe=new R({color:16769184,emissive:13797943,emissiveIntensity:1.4,roughness:.22,metalness:.35});u.add(Pe);for(let e of x)e.level.checkpoints.forEach((t,n)=>{let r=new F(U,Pe);r.position.set(t[0],t[1]+1.25,t[2]),r.scale.setScalar(n===0?1.25:.82),r.userData.attractionId=e.id,r.userData.phase=n*.7+e.lengthMeters*.01,r.userData.baseY=r.position.y,Ne.add(r)});let Fe=new Te({color:3972772,roughness:.14,metalness:.06,transmission:.08,transparent:!0,opacity:.78,clearcoat:.8,clearcoatRoughness:.12});u.add(Fe);let Le={stone:w,foliage:D,water:Fe,dark:E,gold:sn(u,n.gold.clone())},Re=_.map(e=>({attraction:e,group:un(i,l,u,d,e,Le,n)})),ze=Re.map(({group:e})=>e);fn(i,l,u);let Ve=pn(i,l,u,_,n),He=[],q=1;for(let[e,t,n,r]of[[1320,1750,24,18],[1960,1180,32,23],[1240,720,28,16]]){let a=new F(rn(l,new P(n,r,8,16)),Fe);a.position.set(e,G+r/2,t),a.rotation.y=Math.PI,a.name=`Animated jungle waterfall`,i.add(a),He.push(a)}let Ue=!1,We=null,Ge=(e,t)=>!t||We===e.id||t.distanceToSquared(new p(...e.entry))<=(We?9e4:211600),Ke=e=>{_e.forEach((t,n)=>{t.visible=We===null&&Ge(_[n],e)}),Re.forEach(({attraction:t,group:n})=>{n.visible=Ge(t,e)}),C.forEach(({attraction:t,group:n})=>{n.visible=Ge(t,e)})};return{obstacles:S,attractions:_,hubSpawn:K,architectureCount:Re.length,reflectionSurfaceCount:2,nearestAttraction:e=>{let t=null,n=1/0;for(let r of _){let i=new p(...r.entry),a=Math.hypot(e.x-i.x,e.z-i.z,(e.y-i.y)*.5);a<n&&a<18&&(n=a,t=r)}return t},getAttraction:e=>_.find(t=>t.id===e)??null,setFocus(e){We=e===`floating-hub`?null:e;let t=We===null;ge.visible=t,ve.visible=t,Ve.visible=t,Ne.children.forEach(e=>{e.visible=t||e.userData.attractionId===We}),ye.setVisible(We===null),Ke()},update(e,t,n){Ke(n),_e.forEach((t,n)=>{let r=t.userData.flag;r&&(r.rotation.y=Math.sin(e*1.4+n)*.16,r.rotation.z=Math.sin(e*1.1+n*.7)*.05)}),Ne.children.forEach((t,n)=>{t.position.y=t.userData.baseY+Math.sin(e*2.4+n*.43)*.12,t.rotation.y=e*.9+n}),ye.update(e),ze.forEach(e=>{e.traverse(e=>{e.userData.dynamics?.forEach(({mesh:e,rate:n})=>{e.rotation.y+=n*t})})}),He.forEach((t,n)=>{let r=t.material;r.opacity=.68+Math.sin(e*2.1+n)*.08,t.scale.set(q*(.96+Math.sin(e*2.7+n)*.035),q,q)})},setQuality(e,t){Se.castShadow=Ce.castShadow=Me.castShadow=e,Ee.castShadow=!1,ze.forEach(t=>{t.traverse(t=>{t instanceof F&&(t.castShadow=e)})}),Ve.traverse(t=>{t instanceof F&&(t.castShadow=e&&t.userData.skylineShadowCaster===!0,t.receiveShadow=e)});let n=e?t?.92:1:.76;q=n,He.forEach(e=>{e.material=Fe,e.scale.setScalar(n)}),ye.setQuality(e,t)},dispose(){if(!Ue){Ue=!0;for(let t of S)e.removeRigidBody(t.body),hn(t.visual);i.removeFromParent(),l.forEach(e=>e.dispose()),u.forEach(e=>e.dispose()),d.forEach(e=>e.dispose()),ye.dispose(),i.clear()}}}}var vn=Math.PI*2,yn=[1160,1530],bn=[980,1340],xn=Math.atan2(...bn),Sn=1780,Cn=e=>{let t=k.clamp(e,0,1);return t*t*t*(t*(t*6-15)+10)},wn=class{meadowHeight;duration=76;camera=new xe(50,1,.5,1e4);target=new p;startPoint;elapsed=0;orbitAngle=0;currentShot=`meadow`;currentShotProgress=0;entryCamera=new p;entryTarget=new p;constructor(e=[0,80,512],t=()=>0){this.meadowHeight=t,this.startPoint=e instanceof p?e.clone():new p(...e),this.entryCamera.copy(this.startPoint).add(new p(-8,5,10)),this.entryTarget.copy(this.startPoint).add(new p(0,1,0)),this.camera.name=`Aincrad cinematic camera`,this.update(0,1)}get time(){return this.elapsed}get finished(){return this.elapsed>=this.duration}get frame(){let e={meadow:[`群山之上`,`穿過高山草原，尋找雲海中的浮遊城`],approach:[`浮遊城`,`一百層的天際，懸浮於雲與光之間`],orbit:[`環城巡禮`,`完整環視浮遊城，從基座仰望最高王座`],facade:[`天空聖堂`,`掠過層疊城區，仰望雲端的尖塔與彩窗`],arrival:[`向天空啟程`,`沿城外螺旋古道，一路攀向最頂端`]}[this.currentShot];return{shot:this.currentShot,label:e[0],subtitle:e[1],progress:this.elapsed/this.duration,shotProgress:this.currentShotProgress,time:this.elapsed,finished:this.finished,orbitRadians:this.orbitAngle,orbitDegrees:k.radToDeg(this.orbitAngle),position:this.camera.position.toArray(),target:this.target.toArray()}}update(e,t){this.elapsed=k.clamp(Number.isFinite(e)?e:0,0,this.duration),Number.isFinite(t)&&t>0&&(this.camera.aspect=t);let n=this.elapsed,r=this.camera;if(n<11){this.currentShot=`meadow`,this.currentShotProgress=n/11;let e=Cn(this.currentShotProgress);r.position.set(k.lerp(yn[0],bn[0],e),0,k.lerp(yn[1],bn[1],e));let t=Cn((n-3.5)/7.5);r.position.y=this.meadowHeight(r.position.x,r.position.z)+3.2+70.8*t,this.target.set(0,k.lerp(100,290,e),0),r.fov=k.lerp(55,48,e),this.orbitAngle=0}else if(n<17){this.currentShot=`approach`,this.currentShotProgress=(n-11)/6;let e=Cn(this.currentShotProgress),t=k.lerp(Math.hypot(...bn),Sn,e);r.position.set(Math.sin(xn)*t,k.lerp(this.meadowHeight(...bn)+74,360,e),Math.cos(xn)*t),this.target.set(0,k.lerp(290,315,e),0),r.fov=k.lerp(48,52,e),this.orbitAngle=0}else if(n<45){this.currentShot=`orbit`,this.currentShotProgress=(n-17)/28;let e=Cn(this.currentShotProgress),t=Math.sin(Math.PI*e),i=Sn-180*t;this.orbitAngle=vn*e;let a=xn+this.orbitAngle;r.position.set(Math.sin(a)*i,360+80*e+110*t,Math.cos(a)*i),this.target.set(0,315+38*t,0),r.fov=52-3*t}else if(n<63){this.currentShot=`facade`,this.currentShotProgress=(n-45)/18;let e=Cn(this.currentShotProgress),t=xn-.48*e,i=k.lerp(Sn,410,e);r.position.set(Math.sin(t)*i,440+295*e,Math.cos(t)*i),this.target.set(0,k.lerp(315,700,e),0),r.fov=k.lerp(52,48,e),this.orbitAngle=vn}else{this.currentShot=`arrival`,this.currentShotProgress=(n-63)/13;let e=Cn(this.currentShotProgress),t=Math.atan2(this.entryCamera.x,this.entryCamera.z),i=Math.atan2(Math.sin(t-(xn-.48)),Math.cos(t-(xn-.48))),a=xn-.48+i*e,o=k.lerp(410,Math.hypot(this.entryCamera.x,this.entryCamera.z),e);r.position.set(Math.sin(a)*o,k.lerp(735,this.entryCamera.y,e),Math.cos(a)*o),this.target.set(0,700,0).lerp(this.entryTarget,Cn(k.smoothstep(e,.15,1))),r.fov=k.lerp(48,55,e),this.orbitAngle=vn}return r.updateProjectionMatrix(),r.lookAt(this.target),r.updateMatrixWorld(),this.frame}},Tn={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`},En=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},Dn=new Ee(-1,1,1,-1,0,1),On=new class extends o{constructor(){super(),this.setAttribute(`position`,new a([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new a([0,2,0,0,2,0],2))}},kn=class{constructor(e){this._mesh=new F(On,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Dn)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},An=class extends En{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof Pe?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=ye.clone(e.uniforms),this.material=new Pe({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new kn(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},jn=class extends En{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},Mn=class extends En{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},Nn=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new O);this._width=n.width,this._height=n.height,t=new b(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:re}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new An(Tn),this.copyPass.material.blending=0,this.timer=new E}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}jn!==void 0&&(r instanceof jn?n=!0:r instanceof Mn&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new O);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},Pn=class extends En{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new T}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},Fn={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new T(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`},In=class e extends En{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e===void 0?new O(256,256):new O(e.x,e.y),this.clearColor=new T(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new b(i,a,{type:re}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new b(i,a,{type:re});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new b(i,a,{type:re});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),i=Math.round(i/2),a=Math.round(a/2)}let o=Fn;this.highPassUniforms=ye.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Pe({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let s=[6,10,14,18,22];i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(s[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new O(1/i,1/a),i=Math.round(i/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new p(1,1,1),new p(1,1,1),new p(1,1,1),new p(1,1,1),new p(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=ye.clone(Tn.uniforms),this.blendMaterial=new Pe({uniforms:this.copyUniforms,vertexShader:Tn.vertexShader,fragmentShader:Tn.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new T,this._oldClearAlpha=1,this._basic=new Oe,this._fsQuad=new kn(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new O(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(t,n,r,i,a){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this._fsQuad.render(t),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(r),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);return new Pe({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new O(.5,.5)},direction:{value:new O(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

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

				}`})}_getCompositeMaterial(e){return new Pe({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

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

				}`})}};In.BlurDirectionX=new O(1,0),In.BlurDirectionY=new O(0,1);var Ln={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`},Rn=class extends En{constructor(){super(),this.isOutputPass=!0,this.uniforms=ye.clone(Ln.uniforms),this.material=new _e({name:Ln.name,uniforms:this.uniforms,vertexShader:Ln.vertexShader,fragmentShader:Ln.fragmentShader}),this._fsQuad=new kn(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},be.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},zn={name:`FXAAShader`,uniforms:{tDiffuse:{value:null},resolution:{value:new O(1/1024,1/512)}},vertexShader:`

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

		}`},Bn=class extends An{constructor(){super(zn)}setSize(e,t){this.material.uniforms.resolution.value.set(1/e,1/t)}},Vn={name:`GTAOShader`,defines:{PERSPECTIVE_CAMERA:1,SAMPLES:16,NORMAL_VECTOR_TYPE:1,DEPTH_SWIZZLING:`x`,SCREEN_SPACE_RADIUS:0,SCREEN_SPACE_RADIUS_SCALE:100,SCENE_CLIP_BOX:0},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new O},cameraNear:{value:null},cameraFar:{value:null},cameraProjectionMatrix:{value:new n},cameraProjectionMatrixInverse:{value:new n},cameraWorldMatrix:{value:new n},radius:{value:.25},distanceExponent:{value:1},thickness:{value:1},distanceFallOff:{value:1},scale:{value:1},sceneBoxMin:{value:new p(-1,-1,-1)},sceneBoxMax:{value:new p(1,1,1)}},vertexShader:`

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
		}`},Hn={name:`GTAODepthShader`,defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`
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

		}`},Un={name:`GTAOBlendShader`,uniforms:{tDiffuse:{value:null},intensity:{value:1}},vertexShader:`
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
		}`};function Wn(e=5){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),n=Gn(t),r=n.length,i=new Uint8Array(r*4);for(let e=0;e<r;++e){let t=n[e],a=2*Math.PI*t/r,o=new p(Math.cos(a),Math.sin(a),0).normalize();i[e*4]=(o.x*.5+.5)*255,i[e*4+1]=(o.y*.5+.5)*255,i[e*4+2]=127,i[e*4+3]=255}let a=new x(i,t,t);return a.wrapS=ge,a.wrapT=ge,a.needsUpdate=!0,a}function Gn(e){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),n=t*t,r=Array(n).fill(0),i=Math.floor(t/2),a=t-1;for(let e=1;e<=n;){if(i===-1&&a===t?(a=t-2,i=0):(a===t&&(a=0),i<0&&(i=t-1)),r[i*t+a]!==0){a-=2,i++;continue}r[i*t+a]=e++,a++,i--}return r}var Kn={name:`PoissonDenoiseShader`,defines:{SAMPLES:16,SAMPLE_VECTORS:qn(16,2,1),NORMAL_VECTOR_TYPE:1,DEPTH_VALUE_SOURCE:0},uniforms:{tDiffuse:{value:null},tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new O},cameraProjectionMatrixInverse:{value:new n},lumaPhi:{value:5},depthPhi:{value:5},normalPhi:{value:5},radius:{value:4},index:{value:0}},vertexShader:`

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
		}`};function qn(e,t,n){let r=Jn(e,t,n),i=`vec3[SAMPLES](`;for(let t=0;t<e;t++){let n=r[t];i+=`vec3(${n.x}, ${n.y}, ${n.z})${t<e-1?`,`:`)`}`}return i}function Jn(e,t,n){let r=[];for(let i=0;i<e;i++){let a=2*Math.PI*t*i/e,o=(i/(e-1))**n;r.push(new p(Math.cos(a),Math.sin(a),o))}return r}var Yn=class{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(e.random()*256);this.perm=[];for(let e=0;e<512;e++)this.perm[e]=this.p[e&255];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}noise(e,t){let n,r,i,a=.5*(Math.sqrt(3)-1),o=(e+t)*a,s=Math.floor(e+o),c=Math.floor(t+o),l=(3-Math.sqrt(3))/6,u=(s+c)*l,d=s-u,f=c-u,p=e-d,m=t-f,h,g;p>m?(h=1,g=0):(h=0,g=1);let _=p-h+l,v=m-g+l,y=p-1+2*l,b=m-1+2*l,x=s&255,S=c&255,C=this.perm[x+this.perm[S]]%12,w=this.perm[x+h+this.perm[S+g]]%12,T=this.perm[x+1+this.perm[S+1]]%12,E=.5-p*p-m*m;E<0?n=0:(E*=E,n=E*E*this._dot(this.grad3[C],p,m));let D=.5-_*_-v*v;D<0?r=0:(D*=D,r=D*D*this._dot(this.grad3[w],_,v));let O=.5-y*y-b*b;return O<0?i=0:(O*=O,i=O*O*this._dot(this.grad3[T],y,b)),70*(n+r+i)}noise3d(e,t,n){let r,i,a,o,s=(e+t+n)*(1/3),c=Math.floor(e+s),l=Math.floor(t+s),u=Math.floor(n+s),d=1/6,f=(c+l+u)*d,p=c-f,m=l-f,h=u-f,g=e-p,_=t-m,v=n-h,y,b,x,S,C,w;g>=_?_>=v?(y=1,b=0,x=0,S=1,C=1,w=0):g>=v?(y=1,b=0,x=0,S=1,C=0,w=1):(y=0,b=0,x=1,S=1,C=0,w=1):_<v?(y=0,b=0,x=1,S=0,C=1,w=1):g<v?(y=0,b=1,x=0,S=0,C=1,w=1):(y=0,b=1,x=0,S=1,C=1,w=0);let T=g-y+d,E=_-b+d,D=v-x+d,O=g-S+2*d,k=_-C+2*d,ee=v-w+2*d,A=g-1+3*d,te=_-1+3*d,ne=v-1+3*d,j=c&255,M=l&255,re=u&255,ie=this.perm[j+this.perm[M+this.perm[re]]]%12,ae=this.perm[j+y+this.perm[M+b+this.perm[re+x]]]%12,oe=this.perm[j+S+this.perm[M+C+this.perm[re+w]]]%12,se=this.perm[j+1+this.perm[M+1+this.perm[re+1]]]%12,N=.6-g*g-_*_-v*v;N<0?r=0:(N*=N,r=N*N*this._dot3(this.grad3[ie],g,_,v));let ce=.6-T*T-E*E-D*D;ce<0?i=0:(ce*=ce,i=ce*ce*this._dot3(this.grad3[ae],T,E,D));let le=.6-O*O-k*k-ee*ee;le<0?a=0:(le*=le,a=le*le*this._dot3(this.grad3[oe],O,k,ee));let ue=.6-A*A-te*te-ne*ne;return ue<0?o=0:(ue*=ue,o=ue*ue*this._dot3(this.grad3[se],A,te,ne)),32*(r+i+a+o)}noise4d(e,t,n,r){let i=this.grad4,a=this.simplex,o=this.perm,s=(Math.sqrt(5)-1)/4,c=(5-Math.sqrt(5))/20,l,u,d,f,p,m=(e+t+n+r)*s,h=Math.floor(e+m),g=Math.floor(t+m),_=Math.floor(n+m),v=Math.floor(r+m),y=(h+g+_+v)*c,b=h-y,x=g-y,S=_-y,C=v-y,w=e-b,T=t-x,E=n-S,D=r-C,O=w>T?32:0,k=w>E?16:0,ee=T>E?8:0,A=w>D?4:0,te=T>D?2:0,ne=+(E>D),j=O+k+ee+A+te+ne,M=+(a[j][0]>=3),re=+(a[j][1]>=3),ie=+(a[j][2]>=3),ae=+(a[j][3]>=3),oe=+(a[j][0]>=2),se=+(a[j][1]>=2),N=+(a[j][2]>=2),ce=+(a[j][3]>=2),le=+(a[j][0]>=1),ue=+(a[j][1]>=1),de=+(a[j][2]>=1),fe=+(a[j][3]>=1),pe=w-M+c,P=T-re+c,F=E-ie+c,I=D-ae+c,me=w-oe+2*c,he=T-se+2*c,ge=E-N+2*c,L=D-ce+2*c,_e=w-le+3*c,ve=T-ue+3*c,R=E-de+3*c,z=D-fe+3*c,ye=w-1+4*c,be=T-1+4*c,B=E-1+4*c,xe=D-1+4*c,Se=h&255,Ce=g&255,V=_&255,H=v&255,we=o[Se+o[Ce+o[V+o[H]]]]%32,Te=o[Se+M+o[Ce+re+o[V+ie+o[H+ae]]]]%32,Ee=o[Se+oe+o[Ce+se+o[V+N+o[H+ce]]]]%32,De=o[Se+le+o[Ce+ue+o[V+de+o[H+fe]]]]%32,Oe=o[Se+1+o[Ce+1+o[V+1+o[H+1]]]]%32,ke=.6-w*w-T*T-E*E-D*D;ke<0?l=0:(ke*=ke,l=ke*ke*this._dot4(i[we],w,T,E,D));let Ae=.6-pe*pe-P*P-F*F-I*I;Ae<0?u=0:(Ae*=Ae,u=Ae*Ae*this._dot4(i[Te],pe,P,F,I));let je=.6-me*me-he*he-ge*ge-L*L;je<0?d=0:(je*=je,d=je*je*this._dot4(i[Ee],me,he,ge,L));let Me=.6-_e*_e-ve*ve-R*R-z*z;Me<0?f=0:(Me*=Me,f=Me*Me*this._dot4(i[De],_e,ve,R,z));let Ne=.6-ye*ye-be*be-B*B-xe*xe;return Ne<0?p=0:(Ne*=Ne,p=Ne*Ne*this._dot4(i[Oe],ye,be,B,xe)),27*(l+u+d+f+p)}_dot(e,t,n){return e[0]*t+e[1]*n}_dot3(e,t,n,r){return e[0]*t+e[1]*n+e[2]*r}_dot4(e,t,n,r,i){return e[0]*t+e[1]*n+e[2]*r+e[3]*i}},Xn=class e extends En{constructor(e,t,n=512,r=512,i,a,o){super(),this.width=n,this.height=r,this.clear=!0,this.camera=t,this.scene=e,this.output=0,this._renderGBuffer=!0,this._visibilityCache=[],this.blendIntensity=1,this.pdRings=2,this.pdRadiusExponent=2,this.pdSamples=16,this.gtaoNoiseTexture=Wn(),this.pdNoiseTexture=this._generateNoise(),this.gtaoRenderTarget=new b(this.width,this.height,{type:re}),this.pdRenderTarget=this.gtaoRenderTarget.clone(),this.gtaoMaterial=new Pe({defines:Object.assign({},Vn.defines),uniforms:ye.clone(Vn.uniforms),vertexShader:Vn.vertexShader,fragmentShader:Vn.fragmentShader,blending:0,depthTest:!1,depthWrite:!1}),this.gtaoMaterial.defines.PERSPECTIVE_CAMERA=+!!this.camera.isPerspectiveCamera,this.gtaoMaterial.uniforms.tNoise.value=this.gtaoNoiseTexture,this.gtaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.normalMaterial=new Ce,this.normalMaterial.blending=0,this.pdMaterial=new Pe({defines:Object.assign({},Kn.defines),uniforms:ye.clone(Kn.uniforms),vertexShader:Kn.vertexShader,fragmentShader:Kn.fragmentShader,depthTest:!1,depthWrite:!1}),this.pdMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.pdMaterial.uniforms.tNoise.value=this.pdNoiseTexture,this.pdMaterial.uniforms.resolution.value.set(this.width,this.height),this.pdMaterial.uniforms.lumaPhi.value=10,this.pdMaterial.uniforms.depthPhi.value=2,this.pdMaterial.uniforms.normalPhi.value=3,this.pdMaterial.uniforms.radius.value=8,this.depthRenderMaterial=new Pe({defines:Object.assign({},Hn.defines),uniforms:ye.clone(Hn.uniforms),vertexShader:Hn.vertexShader,fragmentShader:Hn.fragmentShader,blending:0}),this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new Pe({uniforms:ye.clone(Tn.uniforms),vertexShader:Tn.vertexShader,fragmentShader:Tn.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:208,blendDst:200,blendEquation:100,blendSrcAlpha:206,blendDstAlpha:200,blendEquationAlpha:100}),this.blendMaterial=new Pe({uniforms:ye.clone(Un.uniforms),vertexShader:Un.vertexShader,fragmentShader:Un.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blending:5,blendSrc:208,blendDst:200,blendEquation:100,blendSrcAlpha:206,blendDstAlpha:200,blendEquationAlpha:100}),this._fsQuad=new kn(null),this._originalClearColor=new T,this.setGBuffer(i?i.depthTexture:void 0,i?i.normalTexture:void 0),a!==void 0&&this.updateGtaoMaterial(a),o!==void 0&&this.updatePdMaterial(o)}setSize(e,t){this.width=e,this.height=t,this.gtaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.pdRenderTarget.setSize(e,t),this.gtaoMaterial.uniforms.resolution.value.set(e,t),this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.pdMaterial.uniforms.resolution.value.set(e,t),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse)}dispose(){this.gtaoNoiseTexture.dispose(),this.pdNoiseTexture.dispose(),this.normalRenderTarget.dispose(),this.gtaoRenderTarget.dispose(),this.pdRenderTarget.dispose(),this.normalMaterial.dispose(),this.pdMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this._fsQuad.dispose()}get gtaoMap(){return this.pdRenderTarget.texture}setGBuffer(e,t){e===void 0?(this.depthTexture=new D,this.depthTexture.format=C,this.depthTexture.type=w,this.normalRenderTarget=new b(this.width,this.height,{minFilter:le,magFilter:le,type:re,depthTexture:this.depthTexture}),this.normalTexture=this.normalRenderTarget.texture,this._renderGBuffer=!0):(this.depthTexture=e,this.normalTexture=t,this._renderGBuffer=!1);let n=+!!this.normalTexture,r=this.depthTexture===this.normalTexture?`w`:`x`;this.gtaoMaterial.defines.NORMAL_VECTOR_TYPE=n,this.gtaoMaterial.defines.DEPTH_SWIZZLING=r,this.gtaoMaterial.uniforms.tNormal.value=this.normalTexture,this.gtaoMaterial.uniforms.tDepth.value=this.depthTexture,this.pdMaterial.defines.NORMAL_VECTOR_TYPE=n,this.pdMaterial.defines.DEPTH_SWIZZLING=r,this.pdMaterial.uniforms.tNormal.value=this.normalTexture,this.pdMaterial.uniforms.tDepth.value=this.depthTexture,this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture}setSceneClipBox(e){e?(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX!==1,this.gtaoMaterial.defines.SCENE_CLIP_BOX=1,this.gtaoMaterial.uniforms.sceneBoxMin.value.copy(e.min),this.gtaoMaterial.uniforms.sceneBoxMax.value.copy(e.max)):(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX===0,this.gtaoMaterial.defines.SCENE_CLIP_BOX=0)}updateGtaoMaterial(e){e.radius!==void 0&&(this.gtaoMaterial.uniforms.radius.value=e.radius),e.distanceExponent!==void 0&&(this.gtaoMaterial.uniforms.distanceExponent.value=e.distanceExponent),e.thickness!==void 0&&(this.gtaoMaterial.uniforms.thickness.value=e.thickness),e.distanceFallOff!==void 0&&(this.gtaoMaterial.uniforms.distanceFallOff.value=e.distanceFallOff,this.gtaoMaterial.needsUpdate=!0),e.scale!==void 0&&(this.gtaoMaterial.uniforms.scale.value=e.scale),e.samples!==void 0&&e.samples!==this.gtaoMaterial.defines.SAMPLES&&(this.gtaoMaterial.defines.SAMPLES=e.samples,this.gtaoMaterial.needsUpdate=!0),e.screenSpaceRadius!==void 0&&+!!e.screenSpaceRadius!==this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS&&(this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS=+!!e.screenSpaceRadius,this.gtaoMaterial.needsUpdate=!0)}updatePdMaterial(e){let t=!1;e.lumaPhi!==void 0&&(this.pdMaterial.uniforms.lumaPhi.value=e.lumaPhi),e.depthPhi!==void 0&&(this.pdMaterial.uniforms.depthPhi.value=e.depthPhi),e.normalPhi!==void 0&&(this.pdMaterial.uniforms.normalPhi.value=e.normalPhi),e.radius!==void 0&&e.radius!==this.radius&&(this.pdMaterial.uniforms.radius.value=e.radius),e.radiusExponent!==void 0&&e.radiusExponent!==this.pdRadiusExponent&&(this.pdRadiusExponent=e.radiusExponent,t=!0),e.rings!==void 0&&e.rings!==this.pdRings&&(this.pdRings=e.rings,t=!0),e.samples!==void 0&&e.samples!==this.pdSamples&&(this.pdSamples=e.samples,t=!0),t&&(this.pdMaterial.defines.SAMPLES=this.pdSamples,this.pdMaterial.defines.SAMPLE_VECTORS=qn(this.pdSamples,this.pdRings,this.pdRadiusExponent),this.pdMaterial.needsUpdate=!0)}render(t,n,r){switch(this._renderGBuffer&&(this._overrideVisibility(),this._renderOverride(t,this.normalMaterial,this.normalRenderTarget,7829503,1),this._restoreVisibility()),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.gtaoMaterial.uniforms.cameraWorldMatrix.value.copy(this.camera.matrixWorld),this._renderPass(t,this.gtaoMaterial,this.gtaoRenderTarget,16777215,1),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this._renderPass(t,this.pdMaterial,this.pdRenderTarget,16777215,1),this.output){case e.OUTPUT.Off:break;case e.OUTPUT.Diffuse:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.AO:this.copyMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Denoise:this.copyMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Depth:this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this._renderPass(t,this.depthRenderMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n),this.blendMaterial.uniforms.intensity.value=this.blendIntensity,this.blendMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this._renderPass(t,this.blendMaterial,this.renderToScreen?null:n);break;default:console.warn(`THREE.GTAOPass: Unknown output type.`)}}_renderPass(e,t,n,r,i){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,r!=null&&(e.setClearColor(r),e.setClearAlpha(i||0),e.clear()),this._fsQuad.material=t,this._fsQuad.render(e),e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_renderOverride(e,t,n,r,i){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,r=t.clearColor||r,i=t.clearAlpha||i,r!=null&&(e.setClearColor(r),e.setClearAlpha(i||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_overrideVisibility(){let e=this.scene,t=this._visibilityCache;e.traverse(function(e){(e.isPoints||e.isLine||e.isLine2)&&e.visible&&(e.visible=!1,t.push(e))})}_restoreVisibility(){let e=this._visibilityCache;for(let t=0;t<e.length;t++)e[t].visible=!0;e.length=0}_generateNoise(e=64){let t=new Yn,n=e*e*4,r=new Uint8Array(n);for(let n=0;n<e;n++)for(let i=0;i<e;i++){let a=n,o=i;r[(n*e+i)*4]=(t.noise(a,o)*.5+.5)*255,r[(n*e+i)*4+1]=(t.noise(a+e,o)*.5+.5)*255,r[(n*e+i)*4+2]=(t.noise(a,o+e)*.5+.5)*255,r[(n*e+i)*4+3]=(t.noise(a+e,o+e)*.5+.5)*255}let i=new x(r,e,e,Se,S);return i.wrapS=ge,i.wrapT=ge,i.needsUpdate=!0,i}};Xn.OUTPUT={Off:-1,Default:0,Diffuse:1,Depth:2,Normal:3,AO:4,Denoise:5};var Zn=class{renderer;composer;renderPass;bloom;ao;output=new Rn;fxaa=new Bn;copyMaterial=new Pe({name:`Aincrad screen composite`,uniforms:{tDiffuse:{value:null},gradeContrast:{value:1},gradeSaturation:{value:1},gradeExposure:{value:1}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,fragmentShader:`uniform sampler2D tDiffuse; uniform float gradeContrast; uniform float gradeSaturation; uniform float gradeExposure; varying vec2 vUv; void main(){
        vec3 c=texture2D(tDiffuse,vUv).rgb;
        float gradeLuminance=dot(c,vec3(.2126,.7152,.0722));
        c=mix(vec3(gradeLuminance),c,gradeSaturation);
        c=(c-vec3(.5))*gradeContrast+vec3(.5);
        c*=gradeExposure;
        float l=dot(c,vec3(.2126,.7152,.0722));
        c+=vec3(.013,.002,-.008)*smoothstep(.35,.9,l)+vec3(-.005,.002,.009)*(1.-smoothstep(.1,.45,l));
        vec2 p=vUv*2.-1.; float vignette=1.-.11*dot(p*.65,p*.65);
        float grain=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.003;
        gl_FragColor=vec4(c*vignette+grain,1.);
      }`,depthTest:!1,depthWrite:!1,blending:0,toneMapped:!1});copy=new kn(this.copyMaterial);viewport=new _;scissor=new _;width=0;height=0;disposed=!1;constructor(e,t,n){this.renderer=e;let r=new b(8,8,{type:re,depthBuffer:!0,stencilBuffer:!1});r.texture.name=`Aincrad HDR`,this.composer=new Nn(e,r),this.composer.setPixelRatio(1),this.composer.renderToScreen=!1,this.renderPass=new Pn(t,n),this.ao=new Xn(t,n,8,8),this.ao.blendIntensity=.62,this.ao.updateGtaoMaterial({radius:2.4,thickness:1.5,distanceFallOff:1,samples:12,screenSpaceRadius:!1}),this.ao.updatePdMaterial({radius:4,samples:8,rings:2});let i=this.ao.render.bind(this.ao);this.ao.render=(...e)=>{let t=[];this.ao.scene.traverse(e=>{if(!e.visible)return;let n=e,r=n.material?Array.isArray(n.material)?n.material:[n.material]:[];(e instanceof j||r.some(e=>e.transparent||e.alphaTest>0||e instanceof Pe))&&(t.push(e),e.visible=!1)});try{i(...e)}finally{t.forEach(e=>e.visible=!0)}},this.bloom=new In(new O(8,8),.16,.42,1.15),this.composer.addPass(this.renderPass),this.composer.addPass(this.ao),this.composer.addPass(this.bloom),this.composer.addPass(this.output),this.composer.addPass(this.fxaa)}render(e,t,n,r,i=0,a=`high`){if(this.disposed)return;let o=this.renderer,s=t.userData.floatingCity===!0,c=Math.min(o.getPixelRatio(),a===`high`?1.5:1),l=Math.max(8,Math.ceil(n*c/8)*8),u=Math.max(8,Math.ceil(r*c/8)*8);(l!==this.width||u!==this.height)&&(this.width=l,this.height=u,this.composer.setSize(l,u),this.ao.setSize(Math.ceil(l/2),Math.ceil(u/2))),this.renderPass.scene=e,this.renderPass.camera=t,this.ao.camera=t,this.ao.scene=e,this.copyMaterial.uniforms.gradeContrast.value=s?1.12:1,this.copyMaterial.uniforms.gradeSaturation.value=s?1.2:1,this.copyMaterial.uniforms.gradeExposure.value=s?1.035:1,this.ao.enabled=a===`high`,this.ao.blendIntensity=a===`high`&&s?.82:.62,this.ao.updateGtaoMaterial({radius:t.name===`Aincrad cinematic camera`?12:s?3.35:2.4,thickness:t.name===`Aincrad cinematic camera`?5:s?2.15:1.5,samples:s?8:12}),this.ao.updatePdMaterial({samples:t.name===`Aincrad cinematic camera`?8:s?5:8}),this.bloom.enabled=a===`high`,this.bloom.strength=.16,this.bloom.radius=s?.5:.42,this.bloom.threshold=s?1.05:1.15,o.getViewport(this.viewport),o.getScissor(this.scissor);let d=o.getRenderTarget(),f=o.getScissorTest(),p=o.autoClear,m=o.toneMapping,h=o.toneMappingExposure;try{o.setScissorTest(!1),o.autoClear=!0,o.toneMapping=6,o.toneMappingExposure=s?.96:1.03,this.composer.render(i),o.setRenderTarget(d),o.setViewport(this.viewport),o.setScissor(this.scissor),o.setScissorTest(f),o.autoClear=!1,this.copyMaterial.uniforms.tDiffuse.value=this.composer.readBuffer.texture,this.copy.render(o)}finally{o.setRenderTarget(d),o.setViewport(this.viewport),o.setScissor(this.scissor),o.setScissorTest(f),o.autoClear=p,o.toneMapping=m,o.toneMappingExposure=h}}dispose(){this.disposed||(this.disposed=!0,this.bloom.dispose(),this.ao.dispose(),this.ao.gtaoMaterial.dispose(),this.ao.blendMaterial.dispose(),this.output.dispose(),this.fxaa.dispose(),this.composer.dispose(),this.copyMaterial.dispose(),this.copy.dispose())}},Qn=[{name:`銀葉巡林者`,color:5005910,accent:12427632,hair:13154711,skin:13147779},{name:`緋暮旅人`,color:6768201,accent:11049343,hair:3549217,skin:12159345},{name:`霧峰斥候`,color:5399403,accent:10987674,hair:10194039,skin:14070425},{name:`苔谷守望者`,color:6841672,accent:11638630,hair:4076582,skin:10252631},{name:`月河尋路人`,color:5198699,accent:10726574,hair:11842730,skin:13080703},{name:`琥珀遊俠`,color:7954758,accent:12756852,hair:7159856,skin:11830372}];function $n(e,t=24){let n=[],r=[],i=[];e.forEach(([a,o,s,c=0],l)=>{for(let u=0;u<=t;u++){let d=u/t*Math.PI*2;if(n.push(Math.sin(d)*o,a,Math.cos(d)*s+c),r.push(u/t,l/(e.length-1)),l&&u){let e=l*(t+1)+u;i.push(e,e-1,e-t-2,e,e-t-2,e-t-1)}}});let s=new o;return s.setAttribute(`position`,new a(n,3)),s.setAttribute(`uv`,new a(r,2)),s.setIndex(i),s.computeVertexNormals(),s}function er(e,t,n=6,r=12){return new i(new u(e.map(([e,t,n])=>new p(e,t,n))),r,t,n,!1)}function tr(e,t=!1){let n=t?[[.129,.914,-.042],[.335,1.008,-.031],[.193,.901,-.052],[.14,.885,-.05]]:[[.114,.936,.002],[.375,1.035,-.013],[.224,.886,-.003],[.138,.865,.006]],r=n.flatMap(([n,r,i])=>[n*e,r,i-(t?.002:.048)]);t||r.push(...n.flatMap(([t,n,r])=>[t*e,n,r+.018]));let i=new o,s=t?[0,1,2,0,2,3]:[0,1,2,0,2,3,6,5,4,7,6,4,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0];if(i.setAttribute(`position`,new a(r,3)),i.setAttribute(`uv`,new a(Array(r.length/3).fill([0,0]).flat(),2)),e<0)for(let e=0;e<s.length;e+=3)[s[e],s[e+2]]=[s[e+2],s[e]];return i.setIndex(s),i.computeVertexNormals(),i}function nr(){let e=new Uint8Array(16384);for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=(t*64+n)*4,i=(n*29+t*31+n*t*3)%13-6,a=205+(n%4<2?19:0)+(t%4<2?15:0)+i;e[r]=e[r+1]=e[r+2]=a,e[r+3]=255}let t=new x(e,64,64,Se);return t.wrapS=t.wrapT=ge,t.repeat.set(5,5),t.magFilter=t.minFilter=ie,t.needsUpdate=!0,t}function rr(e){e.updateMatrixWorld(!0);let t=e.matrixWorld.clone().invert(),n=new Map,r=new Set;e.traverse(e=>{if(!(e instanceof F)||Array.isArray(e.material))return;let i=e.geometry.index?e.geometry.toNonIndexed():e.geometry.clone();i.applyMatrix4(t.clone().multiply(e.matrixWorld));let a=n.get(e.material)??[];a.push(i),n.set(e.material,a),r.add(e.geometry)}),e.clear();for(let[t,r]of n){let n=he(r);n&&I(e,n,t),r.forEach(e=>e.dispose())}r.forEach(e=>e.dispose())}var ir=class{id;root=new M;rig=new M;limbs=[];eyes=new M;marker;materials=[];opacity=1;skin;head=new M;elbows=[];knees=[];cloak;cloakBase;cloakFrame=0;targetRotation=new H;targetEuler=new ee(0,0,0,`YXZ`);constructor(e,t,n=e%10){this.id=e;let r=Qn[(n%Qn.length+Qn.length)%Qn.length];this.skin={name:r.name,color:r.color,accent:r.accent,type:`elf`},this.root.name=`castle-exclusive-elf`,this.root.userData.costume=r.name,this.root.userData.appearance=`elf`,this.root.add(this.rig);let i=nr(),o=(e,t=.8,n=0)=>new R({color:e,roughness:t,metalness:n}),s=new Te({color:r.skin,roughness:.62,metalness:0,sheen:.16,sheenColor:14990245,sheenRoughness:.85}),c=o(new T(r.skin).multiplyScalar(.8).getHex(),.74);c.side=2;let l=o(r.color,.93);l.map=i,l.bumpMap=i,l.bumpScale=.009;let u=o(4601643,.73);u.bumpMap=i,u.bumpScale=.004;let d=o(2959652,.83),f=o(r.accent,.41,.72),p=o(9601642,.9),m=o(r.hair,.72),h=o(new T(r.hair).lerp(new T(13219488),.23).getHex(),.69),g=o(4215626,.4),_=o(1120021,.3),v=o(12762026,.44),y=o(new T(r.skin).lerp(new T(7225401),.5).getHex(),.85),b=(e,t=20,n=12)=>new U(e,t,n),x=new M;this.rig.add(x),I(x,$n([[-.11,.14,.088],[-.025,.157,.105],[.15,.123,.093],[.37,.18,.116],[.49,.209,.105],[.55,.173,.08],[.6,.061,.058]]),l),I(x,$n([[.115,.133,.106],[.23,.14,.113],[.405,.19,.126],[.5,.195,.11]]),u),I(x,new z(.05,.059,.145,16),s,[0,.635,0]),I(x,$n([[.565,.075,.066],[.64,.063,.058]]),l);let S=I(x,new B(.069,.008,5,24),p,[0,.639,0]);S.rotation.x=Math.PI/2,S.scale.y=.86;for(let e=0;e<5;e++){let t=.27+e*.045;I(x,er([[-.022,t,-.126],[.024,t+.032,-.13]],.0032,4,1),p),I(x,er([[.022,t,-.126],[-.024,t+.032,-.13]],.0032,4,1),p)}let C=I(x,L(.048,.59,.025,.009),d,[-.01,.315,-.138]);C.rotation.z=-.47;let w=I(x,L(.067,.075,.031,.004),f,[-.042,.4,-.156]);w.rotation.z=-.47,I(x,L(.027,.04,.015,.003),d,[-.042,.4,-.178]).rotation.z=-.47,I(x,$n([[.065,.162,.116],[.135,.146,.116]]),d),I(x,L(.086,.066,.02,.006),f,[0,.1,-.125]),I(x,L(.057,.039,.025,.002),u,[0,.1,-.138]),I(x,new W(.007,.047,.008),f,[0,.1,-.154]);for(let e of[-1,1]){let t=I(x,L(.132,.28,.046,.015),l,[e*.081,-.083,-.086]);t.rotation.z=e*.11;let n=I(x,L(.007,.235,.012,.002),p,[e*.138,-.083,-.112]);n.rotation.z=e*.11,I(x,L(.13,.12,.08,.015),u,[e*.18,.07,0]),I(x,L(.115,.038,.084,.01),d,[e*.18,.105,-.003]),I(x,b(.011,8,6),f,[e*.18,.079,-.045]),I(x,b(.104),u,[e*.21,.495,.006],[1.08,.72,1.22]),I(x,b(.098),f,[e*.218,.515,.003],[1.08,.38,1.21]);for(let t of[-.082,.074])I(x,b(.008,8,6),f,[e*.236,.502,t]);I(x,b(.025,12,8),f,[e*.13,.515,-.105],[1,1,.35])}rr(x),this.rig.add(this.head);let E=new M;this.head.add(E,this.eyes),I(E,$n([[.698,.021,.032,-.019],[.724,.061,.071,-.006],[.765,.09,.096,.003],[.821,.117,.114,.003],[.887,.125,.121,.002],[.96,.119,.123,.006],[1.019,.09,.105,.016],[1.046,.014,.026,.018]],32),s);for(let e of[-1,1]){I(E,tr(e),s),I(E,tr(e,!0),c),I(E,b(.041,16,10),s,[e*.081,.834,-.085],[1,.52,.53]);let t=I(E,b(.039,16,10),s,[e*.054,.927,-.103],[1.2,.35,.35]);t.rotation.z=e*-.13,I(E,er([[e*.023,.934,-.117],[e*.052,.941,-.119],[e*.087,.931,-.107]],.0043,5,6),m),I(E,er([[e*.019,.907,-.12],[e*.052,.919,-.127],[e*.089,.906,-.107]],.0027,4,6),y),I(this.eyes,b(.036,16,10),v,[e*.053,.905,-.111],[1,.32,.4]),I(this.eyes,b(.011,12,8),g,[e*.049,.905,-.125],[.94,1,.31]),I(this.eyes,b(.005,10,6),_,[e*.049,.905,-.129],[.85,1,.38]),I(this.eyes,b(.0019,8,6),v,[e*.049-.002,.909,-.132])}I(E,b(.032,16,12),s,[0,.873,-.12],[.48,1.7,.72]),I(E,b(.021,16,10),s,[0,.838,-.145],[.7,.66,.89]);for(let e of[-1,1])I(E,b(.012,12,8),s,[e*.015,.832,-.134],[.8,.6,.8]);I(E,er([[-.033,.788,-.092],[-.012,.791,-.107],[0,.787,-.109],[.012,.791,-.107],[.033,.788,-.092]],.003,5,10),y),I(E,b(.027,16,8),s,[0,.768,-.08],[1.05,.33,.35]),I(E,new U(1,28,16,0,Math.PI*2,0,Math.PI*.6),m,[0,.966,.021],[.136,.112,.137]),I(E,b(.125,20,12),m,[0,.938,.07],[.95,1.07,.67]);for(let e=0;e<14;e++){let t=e/13*Math.PI*1.45-Math.PI*.225,n=Math.sin(t),r=Math.cos(t);I(E,er([[n*.035,1.071,.032+r*.022],[n*.109,1.035,.023+r*.094],[n*.136,.959,.023+r*.128]],.0034,4,8),h)}for(let e=0;e<7;e++){let t=e*.011;I(E,er([[.086-t,1.054,-.035],[.022-t,1.065,-.106],[-.065-t*.72,1.015-t*.22,-.131],[-.11-t*.1,.953-t*.55,-.089]],.009-e*5e-4,6,12),e%3?m:h)}for(let e of[-1,1]){I(E,er([[e*.118,.991,.011],[e*.141,.92,.024],[e*.145,.808,.043],[e*.105,.708,.066]],.021,7,12),m);for(let t=0;t<8;t++)I(E,b(.018,12,8),t%2?m:h,[e*(.13+Math.sin(t*2.3)*.012),.84-t*.024,.053],[.7,1,.8]);let t=I(E,new B(.013,.004,5,10),f,[e*.131,.666,.053]);t.rotation.x=Math.PI/2}rr(E),rr(this.eyes),this.eyes.children.forEach(e=>e.position.y-=.905),this.eyes.position.y=.905;for(let e of[-1,1]){let t=new M;t.position.set(e*.232,.482,0);let n=new M;I(n,new ne(.065,.165,6,14),l,[0,-.108,0],[1,1,.94]),I(n,new z(.068,.064,.044,14),u,[0,-.155,0]),rr(n);let r=new M;r.position.y=-.245,I(r,new ne(.051,.15,6,14),l,[0,-.095,0]),I(r,$n([[-.205,.044,.045],[-.17,.061,.052],[-.055,.054,.051]]),u),I(r,L(.056,.126,.024,.01),f,[0,-.12,-.049]);for(let e of[-.065,-.176])I(r,new z(.057,.056,.018,14),d,[0,e,0]);I(r,b(.043,14,10),s,[0,-.239,-.004],[.82,1.34,.59]),I(r,b(.016,10,8),s,[-e*.036,-.226,-.009],[.8,1.65,.85]),I(r,L(.059,.065,.024,.009),d,[0,-.223,.014]),rr(r),t.add(n,r),this.rig.add(t),this.limbs.push(t),this.elbows.push(r)}for(let e of[-1,1]){let t=new M;t.position.set(e*.086,-.02,0);let n=new M;I(n,new ne(.074,.158,6,16),l,[0,-.134,0],[.94,1,1]),I(n,new z(.07,.063,.039,14),d,[0,-.177,0]),rr(n);let r=new M;r.position.y=-.29,I(r,new ne(.051,.17,6,14),l,[0,-.137,0]),I(r,b(.059,14,10),u,[0,-.014,-.033],[.87,.86,.6]),I(r,$n([[-.353,.064,.066],[-.25,.059,.06],[-.16,.065,.067],[-.125,.061,.063]]),u),I(r,new z(.068,.067,.025,14),d,[0,-.137,0]),I(r,b(.071,18,10),u,[0,-.365,-.042],[.93,.66,1.61]),I(r,L(.143,.035,.235,.014),d,[0,-.419,-.047]),I(r,L(.116,.028,.06,.005),f,[0,-.269,-.062]);for(let e=0;e<4;e++)I(r,er([[-.025,-.168-e*.035,-.064],[.025,-.191-e*.035,-.066]],.003,4,1),p);rr(r),t.add(n,r),this.rig.add(t),this.limbs.push(t),this.knees.push(r)}let D=new P(1,1,14,22),O=D.getAttribute(`position`),k=D.getAttribute(`uv`),ee=[];for(let e=0;e<O.count;e++){let t=k.getX(e),n=1-k.getY(e);O.setXYZ(e,(t-.5)*(.365+n*.335),.555-n*1.02,.13+n*.16+Math.cos(t*Math.PI*10)*.015*n);let i=t<.075||t>.925||n>.956,a=new T(i?r.accent:16777215);i&&a.lerp(new T(16777215),.35),ee.push(a.r,a.g,a.b)}D.setAttribute(`color`,new a(ee,3)),D.computeVertexNormals(),this.cloakBase=new Float32Array(O.array);let A=l.clone();A.color.multiplyScalar(.66),A.side=2,A.vertexColors=!0,this.cloak=I(this.rig,D,A),this.cloak.name=`animated-woven-cloak`,t!==null&&(this.marker=I(this.root,new V(.071,0),new R({color:t===0?13810813:9550528,emissive:t===0?8413233:3433582,emissiveIntensity:.4,roughness:.36,metalness:.6}),[0,1.42,0]),this.marker.castShadow=!1);let te=new Set;this.root.traverse(e=>{if(e instanceof F)for(let t of Array.isArray(e.material)?e.material:[e.material])te.add(t)}),this.materials=[...te]}setOpacity(e){if(e=k.clamp(e,0,1),this.opacity!==e){this.opacity=e;for(let t of this.materials){let n=e<1;t.alphaHash!==n&&(t.alphaHash=n,t.needsUpdate=!0),t.opacity=e}}}animate(e,t,n,r,i){let a=e===`run`,o=e===`airborne`,s=e===`finished`,c=t*Math.max(n,1)*2.55,l=Math.sin(c),u=Math.min(1,n/4.5);if(this.rig.position.y=a?Math.abs(l)*.021*u:Math.sin(t*1.9+this.id)*.004,e!==`stumble`){this.targetEuler.set(e===`dive`?-Math.PI/2:a?-.067:0,r,a?l*.016:0,`YXZ`),this.targetRotation.setFromEuler(this.targetEuler),this.rig.quaternion.slerp(this.targetRotation,1-Math.exp(-Math.max(i,.001)*13));for(let n=0;n<2;n++){let r=n===0?-1:1,i=l*r;this.limbs[n].rotation.set(a?i*.67*u:s?2.48+Math.sin(t*4+n)*.12:o?.55:e===`dive`?2.75:.07,0,r*(o?.3:.105)),this.elbows[n].rotation.x=a?.42+Math.max(0,-i)*.3:s?.18:.16,this.limbs[n+2].rotation.x=a?-i*.66*u:o?n?.28:-.38:e===`dive`?-.12:0,this.knees[n].rotation.x=a?-Math.max(0,i)*.97*u:o?-.65:-.025}}this.head.rotation.y=Math.sin(t*.62+this.id)*(a?.015:.035),this.eyes.scale.y=Math.sin(t*1.15+this.id*.7)>.995?.08:1;let d=this.cloak.geometry.getAttribute(`position`),f=this.cloak.geometry.getAttribute(`uv`);for(let e=0;e<d.count;e++){let n=1-f.getY(e),r=f.getX(e),i=n*n;d.setXYZ(e,this.cloakBase[e*3]+Math.sin(t*2.6+n*3+this.id)*i*.022,this.cloakBase[e*3+1]+(a?.12*u:.01)*i,this.cloakBase[e*3+2]+i*((a?.14*u:.02)+Math.sin(t*(a?7:2.5)-n*5+r*4+this.id)*(a?.045:.018)))}d.needsUpdate=!0,++this.cloakFrame%3==0&&this.cloak.geometry.computeVertexNormals(),this.marker&&(this.marker.position.y=1.42+Math.sin(t*2)*.035,this.marker.rotation.y=t*.45)}},ar=class extends De{neighbors=[];lane;constructor(e,t){let n=(e.id%3-1)*2.35,r=t.map((e,r)=>{if(r>=t.length-2)return e.clone();let i=r%96,a=i>=42&&i<=52?.24:1,o=t[r+1].clone().sub(e).normalize(),s=new p(0,1,0).cross(o).normalize();return e.clone().addScaledVector(s,n*a)});super(e,r),this.lane=n}decide(t,n){let r=t>=this.nextReaction,i=super.decide(t,n),a=this.actor;if(r&&(this.nextReaction=t+.04+(1-a.skill)*.045),!a.active||a.machine.state===`respawn`)return i;if(!a.grounded){let t=a.world.castRay(new e.Ray(a.current,{x:0,y:-1,z:0}),2.5,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,e=>!(e.collisionGroups()>>>16&1));return{...i,jump:a.doubleJumpEnabled&&a.airJumpAvailable&&a.body.linvel().y<.2&&!t}}let o=Math.hypot(i.x,i.z);if(o<.01)return i;let s=i.x/o,c=i.z/o,l=e=>!(e.collisionGroups()>>>16&1),u=!1;for(let t of[.7,1.15]){let n=a.world.castRay(new e.Ray({x:a.current.x+s*t,y:a.current.y,z:a.current.z+c*t},{x:0,y:-1,z:0}),2.25,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,l);(!n||n.timeOfImpact<.4)&&(u=!0)}let d=a.world.castRay(new e.Ray({x:a.current.x,y:a.current.y-.1,z:a.current.z},{x:s,y:0,z:c}),3.5,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,e=>!!(e.collisionGroups()>>>16&4)),f=.93+a.skill*.07;for(let e of this.neighbors){if(e===a||!e.active||Math.abs(e.current.y-a.current.y)>1.5)continue;let t=e.current.x-a.current.x,n=e.current.z-a.current.z,r=t*s+n*c,i=t*c-n*s;r>.2&&r<2.2&&Math.abs(i)<.85&&!u&&(f*=.82)}return d&&!u&&(f=d.timeOfImpact<1.7?0:.65),i={...i,x:i.x*f,z:i.z*f},{...i,jump:u||!d&&this.stuckTime>.8}}};export{ar as AincradBrain,wn as AincradCinematic,Zn as AincradPostProcessing,ir as ElfAppearance,ct as aincradMeadowHeight,xt as createAincradCourse,mt as createAincradWorld,_n as createFloatingPark};