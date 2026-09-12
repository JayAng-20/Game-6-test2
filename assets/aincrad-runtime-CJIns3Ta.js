import{a as e,r as t}from"./world-CeqXiYg9.js";import{$ as n,A as r,At as i,B as a,C as o,Ct as s,D as c,Dt as l,E as u,Et as d,F as f,Ft as p,G as m,H as h,I as g,It as _,J as v,K as y,Lt as b,M as x,Mt as S,N as C,Nt as w,O as T,Ot as E,P as D,Pt as O,Q as k,R as A,Rt as j,S as M,St as ee,T as N,Tt as te,U as P,W as F,X as ne,Y as re,Z as ie,_ as ae,_t as oe,a as se,at as I,b as ce,bt as le,ct as ue,d as de,dt as fe,et as L,f as R,ft as z,g as pe,gt as me,h as B,ht as he,i as ge,it as _e,j as V,jt as H,k as ve,kt as ye,lt as be,mt as U,nt as W,ot as xe,pt as Se,q as Ce,rt as we,st as Te,t as Ee,tt as G,u as De,ut as Oe,v as ke,vt as Ae,w as je,wt as Me,x as Ne,y as Pe,yt as Fe,z as Ie,zt as Le}from"./ai-fSLCiJCK.js";import{c as Re,i as K,l as ze,o as Be,r as q,t as Ve,u as He}from"./floating-world-DUB-oRY8.js";var Ue=class e extends G{constructor(){let t=e.SkyShader,n=new s({name:t.name,uniforms:w.clone(t.uniforms),vertexShader:t.vertexShader,fragmentShader:t.fragmentShader,side:1,depthWrite:!1});super(new Ne(1,1,1),n),this.isSky=!0}};Ue.SkyShader={name:`SkyShader`,uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new b},up:{value:new b(0,1,0)},cloudScale:{value:2e-4},cloudSpeed:{value:1e-4},cloudCoverage:{value:.4},cloudDensity:{value:.4},cloudElevation:{value:.5},showSunDisc:{value:1},time:{value:0}},vertexShader:`
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

		}`};function J(e,t){let n=Math.sin(e*127.1+t*311.7)*43758.5453123;return n-Math.floor(n)}function We(e,t){let n=Math.floor(e),r=Math.floor(t),i=e-n,a=t-r;return i=i*i*(3-2*i),a=a*a*(3-2*a),k.lerp(k.lerp(J(n,r),J(n+1,r),i),k.lerp(J(n,r+1),J(n+1,r+1),i),a)}function Ge(e,t){let n=0,r=.5;for(let i=0;i<5;i++)n+=We(e,t)*r,e=e*2.03+17.1,t=t*2.03+9.2,r*=.5;return n}function Ke(e,t,n=!1){let r=new x(e,t,t,he);return r.wrapS=r.wrapT=Ae,r.magFilter=ne,r.minFilter=ie,r.generateMipmaps=!0,r.anisotropy=8,n&&(r.colorSpace=le),r.needsUpdate=!0,r}function qe(e){let t=e===`stone`?1024:512,n=new Uint8Array(t*t*4),r=new Uint8Array(t*t*4),i=new Uint8Array(t*t*4),a=new Float32Array(t*t);for(let r=0;r<t;r++)for(let o=0;o<t;o++){let s=r*t+o,c=s*4,l=J(o,r),u=(Math.sin(Math.PI*o/t)*Math.sin(Math.PI*r/t))**.5,d=o*256/t,f=r*256/t,p=.5+(Ge(d/23,f/23)-.5)*u,m=.5+(Ge(d/84,f/84)-.5)*u,h=p*.7+l*.08,g=160,_=160,v=148;if(e===`stone`){let e=Math.floor(f/32),t=(d+e%2*32)%64,n=f%32,r=t<.65+l*.3||t>63.35||n<.65+l*.3||n>31.35,i=J(Math.floor((d+e%2*32)/64),e),a=Math.abs(Math.sin(d*.12+f*.09+p*15))<.024,o=(r?.51:.65+i*.23)*(.79+p*.25+m*.14)+(l-.5)*.08-(a?.08:0);g=o*205,_=o*202,v=o*185,h=(r?.29:.65+i*.12)+p*.2+l*.09}else if(e===`rock`){let e=Ge(d/12,f/12)*u,t=.49+p*.32+e*.08;g=t*131,_=t*143,v=t*142,h=p*.6+e*.27+l*.1}else{let e=.6+p*.5+l*.11;g=e*108,_=e*124,v=e*58,h=p*.65+l*.35}n[c]=g,n[c+1]=_,n[c+2]=v,n[c+3]=255,a[s]=h;let y=e===`stone`?175+m*67:215+m*36;i[c]=i[c+1]=i[c+2]=y,i[c+3]=255}let o=new b;for(let e=0;e<t;e++)for(let n=0;n<t;n++){let i=(r,i)=>a[(e+i+t)%t*t+(n+r+t)%t];o.set((i(-1,0)-i(1,0))*1.7,(i(0,-1)-i(0,1))*1.7,1).normalize();let s=(e*t+n)*4;r[s]=(o.x*.5+.5)*255,r[s+1]=(o.y*.5+.5)*255,r[s+2]=(o.z*.5+.5)*255,r[s+3]=255}return{map:Ke(n,t,!0),normalMap:Ke(r,t),roughnessMap:Ke(i,t)}}function Je(){let e=qe(`stone`),t=qe(`rock`),n=qe(`grass`),r=new Uint8Array(262144);for(let e=0;e<256;e++)for(let t=0;t<256;t++){let n=(e*256+t)*4,i=t/256,a=e/256,o=Math.abs(Math.sin((i+a*.5)*Math.PI*12))<.075||Math.abs(Math.sin((i-a*.5)*Math.PI*12))<.075,s=new T([2116965,6454396,12096594,5464657,4282745][Math.floor(J(Math.floor(i*12+a*6),Math.floor(i*12-a*6))*5)]),c=o?.08:.8+J(t,e)*.2;r[n]=Math.sqrt(s.r)*255*c,r[n+1]=Math.sqrt(s.g)*255*c,r[n+2]=Math.sqrt(s.b)*255*c,r[n+3]=255}let i=Ke(r,256,!0),a=new I({...e,color:13223865,roughness:.9,normalScale:new _(.48,.48)}),o=new I({...e,color:13353388,roughness:.79,normalScale:new _(.78,.78)}),s=new I({...e,color:14802377,roughness:.86,normalScale:new _(.28,.28)}),c={stone:a,path:o,limestone:s,rock:new I({...t,color:9213585,roughness:1,normalScale:new _(1.05,1.05)}),grass:new I({...n,color:9083492,roughness:1,normalScale:new _(.3,.3)}),bronze:new I({color:5402473,roughness:.57,metalness:.64}),gold:new I({color:12360541,roughness:.46,metalness:.72}),window:new I({color:13950935,map:i,emissiveMap:i,roughness:.19,metalness:.28,emissive:16764800,emissiveIntensity:.35,side:2}),foliage:new I({color:4808509,roughness:1}),bark:new I({...t,color:7496269,roughness:1})};return a.name=s.name=`Aincrad masonry`,o.name=`Aincrad paving`,{...c,dispose(){for(let e of Object.values(c))e.dispose();for(let r of[e,t,n])for(let e of Object.values(r))e.dispose();i.dispose()}}}function Ye(e=0){let t=new Uint8Array(65536),n=(t,n)=>Math.sin((t*4+n*2)*Math.PI*2/128+e)*.55+Math.sin((t*9-n*7)*Math.PI*2/128+e*1.3)*.22+Math.cos((t*17+n*13)*Math.PI*2/128)*.1,r=new b;for(let e=0;e<128;e++)for(let i=0;i<128;i++){r.set((n(i-1,e)-n(i+1,e))*.7,(n(i,e-1)-n(i,e+1))*.7,1).normalize();let a=(e*128+i)*4;t[a]=(r.x*.5+.5)*255,t[a+1]=(r.y*.5+.5)*255,t[a+2]=(r.z*.5+.5)*255,t[a+3]=255}return Ke(t,128)}function Xe(){let e=document.createElement(`canvas`);e.width=e.height=256;let t=e.getContext(`2d`);t.lineCap=`round`;let n=(e,n,r,i,a,o)=>{t.beginPath(),t.moveTo(e,n),t.lineTo(r,i),t.strokeStyle=a,t.lineWidth=o,t.stroke()};n(128,250,128,18,`#65583b`,3);for(let e=0;e<20;e++)for(let t of[-1,1]){let r=236-e*10,i=128+t*((1-e/23)*105),a=r-33;n(128,r,i,a,`#465c34`,1.7);for(let o=0;o<24;o++){let s=o/24,c=128+(i-128)*s,l=r+(a-r)*s,u=J(e,o)>.5?`#577340`:`#8b9a61`;n(c,l,c+t*(6+J(o,e)*9),l-8-J(e,o)*12,u,1.4),n(c,l,c+t*9,l+6,u,1.1)}}let r=new je(e);r.colorSpace=le,r.anisotropy=8;let i=new I({map:r,roughness:1,side:2,alphaTest:.42,color:10728859}),a=[];for(let e=0;e<13;e++)for(let t=0;t<5;t++){let n=.5*(1-e/15),r=.26,i=t/5*Math.PI*2+e*.77,o=new z(n,r,1,2);o.rotateX(-.5),o.translate(0,r/2,n*.22),o.rotateY(i),o.translate(0,.09+e*.059,0),a.push(o)}let o=pe(a);return a.forEach(e=>e.dispose()),{geometry:o,material:i,map:r}}var Ze=Math.PI*2,Qe=e=>484-(e-80)*.55,$e=4;function et(e){let t=k.clamp(Math.floor((e.y-80)/96),0,5),n=Math.atan2(e.x,e.z),r=Math.floor((n+Math.PI)/(Math.PI*2)*$e)%$e;return`district ${t+1} / sector ${r+1}`}function tt(e=!1){let t=(e,t,n,r)=>{e.moveTo(-t,n),e.lineTo(t,n),e.lineTo(t,r*.58),e.quadraticCurveTo(t*.95,r*.82,0,r),e.quadraticCurveTo(-t*.95,r*.82,-t,r*.58),e.closePath()},n=new Me;return e?(n.moveTo(-.5,0),n.lineTo(-.5,.58),n.quadraticCurveTo(-.475,.82,0,1),n.quadraticCurveTo(.475,.82,.5,.58),n.lineTo(.5,0),n.lineTo(.365,0),n.lineTo(.365,.51),n.quadraticCurveTo(.347,.72,0,.88),n.quadraticCurveTo(-.347,.72,-.365,.51),n.lineTo(-.365,0),n.closePath()):t(n,.5,0,1),new Ie(n,{depth:e?.18:.035,bevelEnabled:e,bevelSize:.018,bevelThickness:.018,bevelSegments:1,steps:1,curveSegments:5})}var nt=class{root;chunkFor;batches=new Map;constructor(e,t){this.root=e,this.chunkFor=t}add(e,t,n,r,i,a=new U,o=new T(1,1,1)){let s=this.chunkFor?.(r)??null,c=s?`${e} | ${s}`:e,l=this.batches.get(c);l||(l={name:s?`${e} · ${s}`:e,geometry:t,material:n,matrices:[],colors:[]},this.batches.set(c,l)),l.matrices.push(new L().compose(r,a,i)),l.colors.push(o)}finish(){for(let e of this.batches.values()){let t=e.geometry,n=e.material;if(n instanceof I&&/masonry|paving/.test(n.name)){n=n.clone(),t=t.clone();let r=new Float32Array(e.matrices.length*3);e.matrices.forEach((e,t)=>{let n=e.elements;r[t*3]=Math.hypot(n[0],n[1],n[2]),r[t*3+1]=Math.hypot(n[4],n[5],n[6]),r[t*3+2]=Math.hypot(n[8],n[9],n[10])}),t.setAttribute(`masonrySize`,new Ce(r,3));let i=/Cylinder|Cone/.test(t.type);n.onBeforeCompile=e=>{e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
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
            #endif`)},n.customProgramCacheKey=()=>`masonry-metres-${i}`}let r=new v(t,n,e.matrices.length);r.name=e.name,r.castShadow=!0,r.receiveShadow=!0,e.matrices.forEach((t,n)=>{r.setMatrixAt(n,t),r.setColorAt(n,e.colors[n])}),r.computeBoundingSphere(),this.root.add(r)}}};function rt(e,t){let n=new P;n.name=`Ten terraced districts and the crown cathedral`,e.add(n);let i=new nt(n,et),a=B(1,1,1,.12),o=new V(1,1,1,16),s=new r(1,1,8),c=new r(1,1,4);c.rotateY(Math.PI/4);let l=tt(),u=tt(!0),d=l.getAttribute(`uv`);for(let e=0;e<d.count;e++)d.setX(e,d.getX(e)+.5);let f=t.stone.clone();f.color.set(14537917);let p=t.rock.clone();p.color.set(4545889),p.roughness=.65;let m=t.window.clone();m.emissive.set(16760160),m.emissiveIntensity=.36;let h=(e,t,n)=>new b(e,t,n),g=e=>new U().setFromAxisAngle(h(0,1,0),e),_=(e,t,n,r,a,o=0,s=1)=>i.add(e,t,n,r,a,[`Recessed grand arcade openings`,`Carved gothic archivolts`,`Hundred floors of recessed windows`,`Window surrounds`].includes(e)?g(o).multiply(new U().setFromAxisAngle(h(1,0,0),-Math.atan(.55))):g(o),new T(s,s*.99,s*.96)),v=(e,t,n)=>h(Math.sin(e)*t,n,Math.cos(e)*t),x=(e,t,r,i,a,o)=>{let s=new V(r-.55*i,r,i,192,1,!0),c=s.getAttribute(`uv`);for(let e=0;e<c.count;e++)c.setXY(e,c.getX(e)*r*Ze/4,c.getY(e)*i/4.8);let l=new G(s,o);if(l.position.y=t+i/2,l.castShadow=l.receiveShadow=!0,l.name=e,n.add(l),a){let e=new G(new Fe(r-a,r,192),o),s=e.geometry.getAttribute(`position`),c=e.geometry.getAttribute(`uv`);for(let e=0;e<c.count;e++)c.setXY(e,s.getX(e)/4,s.getY(e)/4.8);e.rotation.x=-Math.PI/2,e.position.y=t+i,e.receiveShadow=!0,n.add(e)}};x(`Continuous inner castle mass behind the arcades`,80,455,540,0,f);for(let e=0;e<10;e++){let n=80+e*54,r=Qe(n);x(`District ${e+1} weathered retaining wall`,n,r-19,43,24,f),x(`Shadowed basal plinth`,n-.4,r+3.5,2.4,10,t.limestone),x(`Broad planted terrace`,n+48,Qe(n+48)+7,2.8,34,t.limestone);for(let e=1;e<10;e++)x(`Minor masonry cornice`,n+e*5.4,Qe(n+e*5.4)-18.4,.38,0,e%3==0?t.limestone:f);let i=72-e*3;for(let r=0;r<i;r++){let o=r/i*Ze,d=Qe(n+4)-5.65,g=.79+J(r,e+31)*.26;_(`Recessed grand arcade openings`,l,m,v(o,d,n+4),h(8,17,.8),o),_(`Carved gothic archivolts`,u,t.limestone,v(o,d+.5,n+4),h(8.5,18,1.8),o,g),_(`Arcade central mullions`,a,t.limestone,v(o,d+.8,n+11),h(.42,13,.9),o);for(let e of[-2.15,2.15]){let r=v(o,d+.8,n+10).add(h(Math.cos(o)*e,0,-Math.sin(o)*e));_(`Arcade slender mullions`,a,t.limestone,r,h(.24,11,.7),o)}_(`Arcade horizontal tracery`,a,t.limestone,v(o,Qe(n+12)-4.9,n+12),h(7.5,.35,.65),o);for(let i=5;i<9;i++){let a=n+i*5.4,s=Qe(a)-18.3;_(`Hundred floors of recessed windows`,l,m,v(o,s,a),h(2.1,3.2,1),o,.6+J(r+i,e)*.4),_(`Window surrounds`,u,t.limestone,v(o,s+.12,a-.1),h(2.5,3.5,.6),o,g)}let y=o+Math.PI/i;if(_(`Load-bearing tapered piers`,a,f,v(y,Qe(n+18)-1,n+19),h(1.8,34,6),y,g),_(`Carved capital blocks`,a,t.limestone,v(y,Qe(n+34),n+34),h(3.2,1.1,6.7),y),r%2==0){let i=n+48,u=7+J(r,e+2)*7,d=Qe(i+u)-3;_(`Terrace town houses`,a,f,v(o,d,i+u/2),h(7.2,u,9),o,g),_(`Clustered steep slate roofs`,c,p,v(o,d,i+u+4.5),h(6.4,9,8),o),_(`Townhouse glazed bays`,l,m,v(o,d+4.7,i+2),h(2.3,3.9,1),o),_(`Roof gilded finials`,s,t.gold,v(o,d,i+u+10),h(.24,2.8,.24),o),_(`Terrace cypress trees`,s,t.foliage,v(o+.014,Qe(i+9)-13,i+7),h(2.3,12,2.3),o)}}for(let r=0;r<12;r++){let i=r/12*Ze+e%2*.12,a=n+15,c=Qe(n+36)+6;_(`District bastion shafts`,o,f,v(i,c,a),h(7.5,30,7.5),i),_(`Bastion machicolations`,o,t.limestone,v(i,c,n+31),h(8.6,2.4,8.6),i),_(`Bastion slate spires`,s,p,v(i,c,n+40),h(8.8,17,8.8),i),_(`Golden bastion tips`,s,t.gold,v(i,c,n+50),h(.45,5,.45),i);for(let e=-1;e<=1;e++){let t=i+e*.045;_(`Bastion arrow slits`,l,m,v(t,c+7.4,n+18),h(1.3,6,1),t)}}}let S=new V(488,65,177,192,16),C=S.getAttribute(`position`);for(let e=0;e<C.count;e++){let t=C.getX(e),n=C.getY(e),r=C.getZ(e),i=Math.atan2(r,t),a=(Math.sin(i*17+n*.024)*6+Math.sin(i*41-n*.033)*4)*(1-(n+88.5)/177);C.setXYZ(e,t+Math.cos(i)*a,n+Math.sin(i*23)*3,r+Math.sin(i)*a)}S.computeVertexNormals();let w=new G(S,t.rock);w.position.y=-14,w.castShadow=w.receiveShadow=!0,n.add(w);let E=new y(1,1);for(let e=0;e<100;e++){let n=e/100*Ze,r=-25-J(e,73)*75,i=(65+(r+102)/177*423)*(.85+J(e,11)*.14);_(`Fractured floating rock strata`,E,t.rock,v(n,i,r),h(25+J(e,4)*24,22+J(e,9)*60,22),n)}x(`Grand foundation rim`,74,491,6,28,t.limestone),x(`Summit sanctuary terrace`,616,184,4,183,f);let D=(e,n,r,i,o,d=0)=>{_(`Cathedral limestone walls`,a,f,h(e,620+o/2,n),h(r,o,i),d),_(`Cathedral pitched roofs`,c,p,h(e,620+o+10,n),h(r*.76,24,i*.75),d);for(let c=-1;c<=1;c+=2)for(let f=0;f<6;f++){let p=h(c*(r/2+.15),12,-i/2+6+f*(i-12)/5).applyQuaternion(g(d)).add(h(e,620,n));_(`Cathedral lancet glass`,l,m,p,h(4,18,1),d+c*Math.PI/2),_(`Cathedral tracery`,u,t.limestone,p.clone().add(h(c*.3,0,0).applyQuaternion(g(d))),h(4.8,19,2),d+c*Math.PI/2);let v=h(c*(r/2+5),o*.43,-i/2+f*i/5).applyQuaternion(g(d)).add(h(e,620,n));_(`Cathedral flying buttresses`,a,t.limestone,v,h(2,o*.86,3),d),_(`Buttress pinnacles`,s,t.limestone,v.clone().add(h(0,o*.43+6,0)),h(2.4,12,2.4),d)}};D(0,0,40,142,44),D(0,0,30,119,37,Math.PI/2);for(let e=0;e<13;e++){let n=e/12*Ze,r=e===12,i=r?0:99,a=r?106:38+e%3*15,c=r?18:8;_(`Cathedral bell towers`,o,f,v(n,i,620+a/2),h(c,a,c),n),_(`Tower cornices`,o,t.limestone,v(n,i,620+a),h(c*1.13,3.2,c*1.13),n),_(`Cathedral needle roofs`,s,p,v(n,i,620+a+(r?35:20)),h(c*1.2,r?70:40,c*1.2),n),_(`Cathedral golden finials`,s,t.gold,v(n,i,620+a+(r?76:46)),h(.7,12,.7),n);for(let e=0;e<8;e++){let o=e/8*Ze,s=v(n,i,620+a-18).add(v(o,c+.2,0));_(`Bell tower openings`,l,m,s,h(r?4.5:2.6,13,1),o),_(`Bell tower frames`,u,t.limestone,s,h(r?5.2:3.2,14,1.5),o)}}return i.finish(),n}var it=class e extends G{constructor(t,n={}){super(t),this.isReflector=!0,this.type=`Reflector`,this.forceUpdate=!1,this._reflectionCameras=new WeakMap;let r=this,i=n.color===void 0?new T(8355711):new T(n.color),a=n.textureWidth||512,o=n.textureHeight||512,c=n.clipBias||0,l=n.shader||e.ReflectorShader,u=n.multisample===void 0?4:n.multisample,d=new fe,f=new b,p=new b,m=new b,h=new L,g=new b(0,0,-1),_=new j,v=new b,y=new b,x=new j,S=new L,C=new Le(a,o,{samples:u,type:F}),E=new s({name:l.name===void 0?`unspecified`:l.name,uniforms:w.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});E.uniforms.tDiffuse.value=C.texture,E.uniforms.color.value=i,E.uniforms.textureMatrix.value=S,this.material=E,this.onBeforeRender=function(e,t,n){let i=this.getReflectionCamera(n);if(p.setFromMatrixPosition(r.matrixWorld),m.setFromMatrixPosition(n.matrixWorld),h.extractRotation(r.matrixWorld),f.set(0,0,1),f.applyMatrix4(h),v.subVectors(p,m),v.dot(f)>0&&this.forceUpdate===!1)return;v.reflect(f).negate(),v.add(p),h.extractRotation(n.matrixWorld),g.set(0,0,-1),g.applyMatrix4(h),g.add(m),y.subVectors(p,g),y.reflect(f).negate(),y.add(p),i.position.copy(v),i.up.set(0,1,0),i.up.applyMatrix4(h),i.up.reflect(f),i.lookAt(y),i.far=n.far,i.updateMatrixWorld(),i.projectionMatrix.copy(n.projectionMatrix),S.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),S.multiply(i.projectionMatrix),S.multiply(i.matrixWorldInverse),S.multiply(r.matrixWorld),d.setFromNormalAndCoplanarPoint(f,p),d.applyMatrix4(i.matrixWorldInverse),_.set(d.normal.x,d.normal.y,d.normal.z,d.constant);let a=i.projectionMatrix;i.isOrthographicCamera?(x.x=(Math.sign(_.x)+a.elements[8])/a.elements[0],x.y=(Math.sign(_.y)+a.elements[9])/a.elements[5],x.z=-n.far,x.w=1):(x.x=(Math.sign(_.x)+a.elements[8])/a.elements[0],x.y=(Math.sign(_.y)+a.elements[9])/a.elements[5],x.z=-1,x.w=(1+a.elements[10])/a.elements[14]),_.multiplyScalar(2/_.dot(x)),a.elements[2]=_.x,a.elements[6]=_.y,i.isOrthographicCamera?(a.elements[10]=_.z-c,a.elements[14]=_.w-1):(a.elements[10]=_.z+1-c,a.elements[14]=_.w),r.visible=!1;let o=e.getRenderTarget(),s=e.xr.enabled,l=e.shadowMap.autoUpdate;e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(C),e.state.buffers.depth.setMask(!0),e.autoClear===!1&&e.clear(),e.render(t,i),e.xr.enabled=s,e.shadowMap.autoUpdate=l,e.setRenderTarget(o);let u=n.viewport;u!==void 0&&e.state.viewport(u),r.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return C},this.dispose=function(){C.dispose(),r.material.dispose()},this.getReflectionCamera=function(e){let t=this._reflectionCameras.get(e);return t===void 0&&(t=e.clone(),this._reflectionCameras.set(e,t)),t}}};it.ReflectorShader={name:`ReflectorShader`,uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
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

		}`};function at(e,t){let n=new z(1,1),r=new it(n,{textureWidth:512,textureHeight:512,multisample:0,clipBias:.002,shader:{name:`Rain puddle with scene reflection and capillary ripples`,uniforms:{color:{value:new T(6716795)},tDiffuse:{value:null},textureMatrix:{value:new L},time:{value:0}},vertexShader:`uniform mat4 textureMatrix; varying vec4 projected; varying vec2 wetUv; varying vec3 eye; varying vec3 planeNormal;
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
        }`}});r.name=`Shallow rainwater · live reflected castle and runners`;let i=r.material;i.transparent=!0,i.depthWrite=!1,i.polygonOffset=!0,i.polygonOffsetFactor=-1,r.renderOrder=2,e.add(r);let a=Re.slice(0,-1).flatMap((e,t)=>t%2==0&&![6,22,38,44,46,48,50,70,86].includes(t%96)?[{index:t,p:e.clone().lerp(Re[t+1],.24)}]:[]),o=r.onBeforeRender,s=null,c=!1,l=!0,u=new j,d=new j;return r.onBeforeRender=(...e)=>{if(c||e[2]!==s||e[1].overrideMaterial)return;let n=e[0],i=t.visible,a=n.getScissorTest();n.getViewport(u),n.getScissor(d),c=!0,t.visible=!1;try{n.setScissorTest(!1),o.apply(r,e)}finally{t.visible=i,n.setViewport(u),n.setScissor(d),n.setScissorTest(a),c=!1}},{prepareCamera(e){if(s=e,!l){r.visible=!1;return}let t=a[0],n=1/0;for(let r of a){let i=r.p.distanceToSquared(e.position);i<n&&(n=i,t=r)}if(r.visible=n<3025,!r.visible)return;let i=Re[t.index+1].clone().sub(Re[t.index]).normalize(),o=new b().crossVectors(new b(0,1,0),i).normalize(),c=new b().crossVectors(i,o).normalize();r.quaternion.setFromRotationMatrix(new L().makeBasis(o,i.clone().negate(),c)),r.position.copy(t.p).addScaledVector(c,.043).addScaledVector(o,t.index%4==0?-.85:.85),r.scale.set(4.6,9.5,1),r.updateMatrixWorld()},update(e){i.uniforms.time.value=e},setEnabled(e){l=e,r.visible=e},setQuality(e,t){r.getRenderTarget().setSize(e&&!t?640:320,e&&!t?640:320)},dispose(){r.onBeforeRender=()=>{},r.removeFromParent(),r.dispose(),n.dispose()}}}var ot=class e extends G{constructor(t,n={}){super(t),this.isRefractor=!0,this.type=`Refractor`,this.camera=new Oe;let r=this,i=n.color===void 0?new T(8355711):new T(n.color),a=n.textureWidth||512,o=n.textureHeight||512,c=n.clipBias||0,l=n.shader||e.RefractorShader,u=n.multisample===void 0?4:n.multisample,d=this.camera;d.matrixAutoUpdate=!1,d.userData.refractor=!0;let f=new fe,p=new L,m=new Le(a,o,{samples:u,type:F});this.material=new s({name:l.name===void 0?`unspecified`:l.name,uniforms:w.clone(l.uniforms),vertexShader:l.vertexShader,fragmentShader:l.fragmentShader,transparent:!0}),this.material.uniforms.color.value=i,this.material.uniforms.tDiffuse.value=m.texture,this.material.uniforms.textureMatrix.value=p;let h=(function(){let e=new b,t=new b,n=new L,i=new b,a=new b;return function(o){return e.setFromMatrixPosition(r.matrixWorld),t.setFromMatrixPosition(o.matrixWorld),i.subVectors(e,t),n.extractRotation(r.matrixWorld),a.set(0,0,1),a.applyMatrix4(n),i.dot(a)<0}})(),g=(function(){let e=new b,t=new b,n=new U,i=new b;return function(){r.matrixWorld.decompose(t,n,i),e.set(0,0,1).applyQuaternion(n).normalize(),e.negate(),f.setFromNormalAndCoplanarPoint(e,t)}})(),_=(function(){let e=new fe,t=new j,n=new j;return function(r){d.matrixWorld.copy(r.matrixWorld),d.matrixWorldInverse.copy(d.matrixWorld).invert(),d.projectionMatrix.copy(r.projectionMatrix),d.far=r.far,e.copy(f),e.applyMatrix4(d.matrixWorldInverse),t.set(e.normal.x,e.normal.y,e.normal.z,e.constant);let i=d.projectionMatrix;n.x=(Math.sign(t.x)+i.elements[8])/i.elements[0],n.y=(Math.sign(t.y)+i.elements[9])/i.elements[5],n.z=-1,n.w=(1+i.elements[10])/i.elements[14],t.multiplyScalar(2/t.dot(n)),i.elements[2]=t.x,i.elements[6]=t.y,i.elements[10]=t.z+1-c,i.elements[14]=t.w}})();function v(e){p.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),p.multiply(e.projectionMatrix),p.multiply(e.matrixWorldInverse),p.multiply(r.matrixWorld)}function y(e,t,n){r.visible=!1;let i=e.getRenderTarget(),a=e.xr.enabled,o=e.shadowMap.autoUpdate;e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(m),e.autoClear===!1&&e.clear(),e.render(t,d),e.xr.enabled=a,e.shadowMap.autoUpdate=o,e.setRenderTarget(i);let s=n.viewport;s!==void 0&&e.state.viewport(s),r.visible=!0}this.onBeforeRender=function(e,t,n){n.userData.refractor!==!0&&h(n)&&(g(),v(n),_(n),y(e,t,n))},this.getRenderTarget=function(){return m},this.dispose=function(){m.dispose(),r.material.dispose()}}};ot.RefractorShader={name:`RefractorShader`,uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`

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

		}`};function st(e){let t=new z(3100,2850),n=new it(t,{textureWidth:512,textureHeight:512,clipBias:.002,multisample:0}),r=new ot(t,{textureWidth:512,textureHeight:512,clipBias:.002,multisample:0}),i=[Ye(),Ye(2.7)],a=new L,o={...w.clone(Pe.fog),reflectionMap:{value:n.getRenderTarget().texture},refractionMap:{value:r.getRenderTarget().texture},normalA:{value:i[0]},normalB:{value:i[1]},textureMatrix:{value:a},time:{value:0},tint:{value:new T(7050900)}},c=new s({name:`AincradLakeReflectionRefraction`,uniforms:o,fog:!0,vertexShader:`
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
      }`}),l=new G(t,c);l.name=`Aincrad alpine lake · reflected and refracted`,l.rotation.x=-Math.PI/2,l.position.set(0,-205,470),l.renderOrder=1,e.add(l),n.matrixAutoUpdate=r.matrixAutoUpdate=!1;let u=!0,d=!1,f=new j,p=new j;return l.onBeforeRender=(...e)=>{if(!u||d||e[1].overrideMaterial)return;let[i,o,s]=e;if(s.position.y<l.position.y)return;d=!0,i.getViewport(f),i.getScissor(p);let c=i.getScissorTest(),m=i.getRenderTarget(),h=l.visible;try{a.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),a.multiply(s.projectionMatrix).multiply(s.matrixWorldInverse).multiply(l.matrixWorld),l.visible=!1,n.matrixWorld.copy(l.matrixWorld),r.matrixWorld.copy(l.matrixWorld),i.setScissorTest(!1),n.onBeforeRender(i,o,s,t,n.material,e[5]),r.onBeforeRender(i,o,s,t,r.material,e[5])}finally{l.visible=h,i.setRenderTarget(m),i.setViewport(f),i.setScissor(p),i.setScissorTest(c),d=!1}},{mesh:l,update(e){o.time.value=e},setQuality(e,t){let i=e&&!t?768:384;n.getRenderTarget().setSize(i,i),r.getRenderTarget().setSize(i,i)},setEnabled(e){u=e,l.visible=e},dispose(){l.onBeforeRender=()=>{},e.remove(l),n.dispose(),r.dispose(),i.forEach(e=>e.dispose()),c.dispose(),t.dispose()}}}var ct=Math.PI*2,lt=k.clamp,ut=Array.from({length:19},(e,t)=>{let n=t/19*ct,r=2750+J(t,21)*1450;return{x:Math.cos(n)*r,z:Math.sin(n)*r,height:520+J(t,74)*1350,width:450+J(t,28)*530}});function dt(e,t){let n=Ge(e/700+11,t/700+8),r=Ge(e/180-7,t/180+20),i=Math.hypot(e/1330,(t-440)/1310),a=k.smoothstep(i,.67,1.12),o=k.lerp(-86+r*19,-1+n*24+r*7,a);for(let n of ut){let r=(e-n.x)/n.width,i=(t-n.z)/n.width,a=Math.atan2(i,r),s=Math.hypot(r*.83,i*1.12)*(1+Math.sin(a*5+n.x)*.19+Math.sin(a*11)*.08),c=Math.max(0,1-s/1.7);o+=n.height*c**2.4*(.48+Ge(e/160,t/160)*.98)}return o-180}function ft(e,t,n,r,i=!1){let a=new v(e,t,n);return a.castShadow=i,a.receiveShadow=!0,r.add(a),a}function pt(e,t,n,r,i,a=1,o=1,s=1,c=0,l=0){let u=new L().compose(new b(n,r,i),new U().setFromEuler(new A(0,c,l)),new b(a,o,s));e.setMatrixAt(t,u)}function mt(e,t,n){let r=e.getAttribute(`uv`);for(let e=0;e<r.count;e++)r.setXY(e,r.getX(e)*t,r.getY(e)*n);return e}function ht(){let e=new Uint8Array(65536);for(let t=0;t<128;t++)for(let n=0;n<128;n++){let r=(n/128-.5)*2,i=(t/128-.5)*2,a=Math.max(0,1-r*r-i*i*1.6),o=Ge(n/26,t/26),s=lt((a*(.4+o)-.14)*1.85,0,1),c=206+lt(i*29+o*35,0,49),l=(t*128+n)*4;e[l]=c,e[l+1]=Math.min(255,c+4),e[l+2]=Math.min(255,c+8),e[l+3]=s*205}let t=new x(e,128,128,he);return t.colorSpace=le,t.magFilter=ne,t.minFilter=ie,t.generateMipmaps=!0,t.needsUpdate=!0,t}function gt(){let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`);t.fillStyle=`black`,t.fillRect(0,0,128,128),t.fillStyle=`white`;for(let e=0;e<17;e++){let n=20+J(e,71)*88,r=n+(J(e,75)-.5)*49,i=24+J(e,79)*103;t.beginPath(),t.moveTo(n-2,128),t.quadraticCurveTo(n-3,128-i*.62,r,128-i),t.quadraticCurveTo(n+3,128-i*.56,n+2,128),t.fill()}let n=new je(e);return n.anisotropy=4,n}function _t(e,t){let n=new P;n.name=`Aincrad · one hundred floating floors`,e.add(n);let r=new Set,i=new Set,a=Je();for(let t of[...e.children])(t instanceof re||t.name===`Aincrad sun target`)&&e.remove(t);e.background=new T(10995668),e.fog=new h(10399671,6e-5);let o=new Ue;o.name=`Aincrad atmospheric scattering`,o.scale.setScalar(7e3);let s=new b(-.7,.53,.48).normalize(),c=new b(-.48,.78,.4).normalize(),u=o.material.uniforms;u.turbidity.value=2.6,u.rayleigh.value=2.1,u.mieCoefficient.value=.003,u.mieDirectionalG.value=.76,u.cloudCoverage.value=.58,u.cloudDensity.value=.55,u.sunPosition.value.copy(s);let d={turbidity:u.turbidity.value,rayleigh:u.rayleigh.value,mieCoefficient:u.mieCoefficient.value,mieDirectionalG:u.mieDirectionalG.value,cloudCoverage:u.cloudCoverage.value,cloudDensity:u.cloudDensity.value},p=e.background instanceof T?e.background.clone():new T(10995668),g=e.fog instanceof h?e.fog.color.clone():new T(10399671),_=e.fog instanceof h?e.fog.density:6e-5;o.material.fragmentShader=o.material.fragmentShader.replace(`gl_FragColor = vec4( texColor, 1.0 );`,`float skyLuminance = dot(texColor, vec3(0.2126, 0.7152, 0.0722));
     texColor *= 1.02 / (1.0 + skyLuminance);
     gl_FragColor = vec4(texColor, 1.0);`),n.add(o);let x=new ee,S=o.clone();S.material=o.material.clone(),x.add(S);let C=new ke(t),w=C.fromScene(x,.015,.1,1e4);C.dispose(),S.material.dispose(),e.environment=w.texture,e.environmentIntensity=.4;let D=new m(13230833,6772544,.54);n.add(D);let O=new f(16768432,3.55);O.name=`Aincrad near-camera sunlight`,O.castShadow=!0,O.shadow.mapSize.set(2048,2048),Object.assign(O.shadow.camera,{left:-56,right:56,top:56,bottom:-56,near:.5,far:520}),O.shadow.bias=-15e-6,O.shadow.normalBias=.018,O.shadow.radius=1.3,n.add(O),n.add(O.target);let A=O.intensity,j=O.color.clone(),N=new f(11916519,.2);N.position.set(400,170,700);let te=new f(9422558,.42);te.position.set(-640,360,-560),te.target.position.set(0,180,0),te.castShadow=!1,te.name=`Floating City cool edge light`,n.add(N,te,te.target);let F=D.intensity,ne=N.intensity,ie=te.intensity,oe=rt(n,a),se=new z(9800,9800,280,280);se.rotateX(-Math.PI/2);let ce=se.getAttribute(`position`),le=new Float32Array(ce.count*3),ue=new T(7570782),de=new T(9606803),fe=new T(13951712),L=new T;for(let e=0;e<ce.count;e++){let t=ce.getX(e),n=ce.getZ(e),r=dt(t,n),i=Math.min(t-640,1460-t,n-1140,1780-n);ce.setY(e,r-25*k.smoothstep(i,0,45));let a=Math.hypot(dt(t+18,n)-r,dt(t,n+18)-r)/18;L.copy(ue).lerp(de,lt(a*.75+(r-210)/850,0,1)),L.lerp(fe,k.smoothstep(r+Ge(t/130,n/130)*130,510,790)*lt(1.3-a*.42,0,1)),L.multiplyScalar(.83+Ge(t/120,n/120)*.3),le[e*3]=L.r,le[e*3+1]=L.g,le[e*3+2]=L.b}se.setAttribute(`color`,new M(le,3)),se.computeVertexNormals(),mt(se,580,580);let R=a.rock.clone();R.color.set(16777215),R.map=null,R.vertexColors=!0,R.normalScale.set(.3,.3),R.onBeforeCompile=e=>{e.vertexShader=`varying vec3 alpineWorld;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
 alpineWorld = (modelMatrix * vec4(transformed,1.0)).xyz;`),e.fragmentShader=`varying vec3 alpineWorld;
      float alpineHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float alpineNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(alpineHash(i),alpineHash(i+vec3(1,0,0)),f.x),mix(alpineHash(i+vec3(0,1,0)),alpineHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(alpineHash(i+vec3(0,0,1)),alpineHash(i+vec3(1,0,1)),f.x),mix(alpineHash(i+vec3(0,1,1)),alpineHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      `+e.fragmentShader,e.fragmentShader=e.fragmentShader.replace(`#include <color_fragment>`,`#include <color_fragment>
      float strata=alpineNoise(alpineWorld*vec3(.09,.16,.09))*.45+alpineNoise(alpineWorld*.033)*.35+alpineNoise(alpineWorld*.42)*.2;
      diffuseColor.rgb *= .66+strata*.49;`),e.fragmentShader=e.fragmentShader.replace(`#include <opaque_fragment>`,`float alpineHaze = smoothstep(950.,5200.,distance(cameraPosition,alpineWorld))*.53*(.45+.55*smoothstep(-50.,400.,alpineWorld.y));
      outgoingLight=mix(outgoingLight,vec3(.38,.52,.62),alpineHaze);
      #include <opaque_fragment>`)},R.customProgramCacheKey=()=>`alpine-strata-aerial-perspective-v2`,i.add(R);let pe=new G(se,R);pe.name=`Alpine grasslands, rocky ridges and snow`,pe.receiveShadow=!0,n.add(pe);let me=new z(820,640,75,65);me.rotateX(-Math.PI/2),me.translate(1050,0,1460);let B=me.getAttribute(`position`);for(let e=0;e<B.count;e++)B.setY(e,dt(B.getX(e),B.getZ(e))+.15);me.computeVertexNormals(),mt(me,120,92);let he=new G(me,a.grass);he.name=`Aincrad local meadow backdrop · hidden in Floating City park`,he.receiveShadow=!0,n.add(he);let ge=new z(1.25,1.1,1,3);ge.translate(0,.55,0);let _e={value:0},H=new I({color:6848329,roughness:1,side:2,alphaTest:.46}),ve=gt();r.add(ve),H.alphaMap=ve,i.add(H),H.onBeforeCompile=e=>{e.uniforms.aincradWindTime=_e,e.vertexShader=`uniform float aincradWindTime;
`+e.vertexShader,e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
      vec3 bladeWorld = (instanceMatrix * vec4(position, 1.0)).xyz;
      transformed.x += sin(aincradWindTime * 1.35 + bladeWorld.x * 0.035 + bladeWorld.z * 0.06) * position.y * position.y * 0.23;
      transformed.z += cos(aincradWindTime * 0.85 + bladeWorld.z * 0.05) * position.y * 0.09;`)},H.customProgramCacheKey=()=>`aincrad-grass-wind-v1`;let ye=ft(ge,H,65e3,n);ye.name=`Wind-swept foreground grasses`;for(let e=0;e<ye.count;e++){let t=920+J(e,12)*310,n=1280+J(e,15)*320,r=.35+J(e,34)*.6;pt(ye,e,t,dt(t,n)+.16,n,r,r,r,J(e,32)*ct),ye.setColorAt(e,new T().setHSL(.18+J(e,54)*.03,.22,.48+J(e,64)*.2))}let be=ae(new y(1,3)),U=be.getAttribute(`position`);for(let e=0;e<U.count;e++){let t=.89+Math.sin(U.getX(e)*5+U.getY(e)*3)*Math.cos(U.getZ(e)*4)*.12;U.setXYZ(e,U.getX(e)*t,U.getY(e)*t,U.getZ(e)*t)}be.computeVertexNormals();let W=ft(be,a.rock,85,n,!0),xe=ft(new V(.15,.3,1,6),a.bark,1500,n,!0),Se=Xe();i.add(Se.material),r.add(Se.map);let Ce=ft(Se.geometry,Se.material,1500,n,!0);for(let e=0;e<1500;e++){let t=Math.floor(e/75),n=J(t,57)*ct+(J(e,58)-.5)*.32,r=1620+J(t,59)*700+(J(e,61)-.5)*420,i=Math.sin(n)*r,a=Math.cos(n)*r,o=dt(i,a),s=i>850&&i<1320&&a>1200&&a<1660?.001:10+J(e,62)*18;pt(xe,e,i,o+s*.22,a,s*.08,s*.44,s*.08),pt(Ce,e,i,o,a,s,s,s,n)}for(let e=0;e<W.count;e++){let t=680+J(e,91)*880,n=1100+J(e,85)*720,r=.45+J(e,88)*5;pt(W,e,t,dt(t,n)+r*.36,n,r*1.4,r*.75,r,J(e,39)*ct)}let we=ht();r.add(we);let Te=new E({map:we,transparent:!0,opacity:.33,depthWrite:!1,fog:!0,color:15921381});i.add(Te);let Ee=[];for(let e=0;e<42;e++){let t=e/42*ct,r=e>=22,i=r?1100+J(e,10)*1350:540+J(e,51)*310,a=new l(Te);a.position.set(Math.cos(t)*i,r?160+J(e,47)*280:-70+J(e,46)*110,Math.sin(t)*i);let o=r?620+J(e,76)*500:240+J(e,77)*200;a.scale.set(o,o*.38,1),n.add(a),Ee.push({sprite:a,origin:a.position.clone(),phase:t})}let De=st(e),Oe=at(e,De.mesh),Ae=!1,je=new b,Me=s.clone().multiplyScalar(175),Ne=!0,Pe=!1,Fe=!1,Ie=!1,Le=t.shadowMap.type;return{sun:O,materials:a,trackMaterial:a.path,update(e,t){_e.value=e,De.update(e),Oe.update(e);for(let{sprite:t,origin:n,phase:r}of Ee)t.position.x=n.x+Math.sin(e*.013+r)*12,t.position.y=n.y+Math.sin(e*.025+r*2)*3},prepareCamera(e){if(Oe.prepareCamera(e),e.getWorldPosition(je),Fe){let e=Math.hypot(je.x-q[0],je.z-q[2]);O.target.position.copy(je),O.position.copy(je).addScaledVector(c,220);let t=e<620?360:120,n=O.shadow.camera;n.left=n.bottom=-t,n.right=n.top=t,n.far=e<620?900:520,O.shadow.bias=-25e-6,n.updateProjectionMatrix(),O.target.updateMatrixWorld(),O.updateMatrixWorld();return}let t=e.name===`Aincrad cinematic camera`,n=t&&je.y>640,r=t||Math.hypot(je.x,je.z)>760,i=r?1-k.smoothstep(je.y,-30,160):0;r?(O.target.position.set(0,n?690:295,0).lerp(je,i),O.position.copy(O.target.position).addScaledVector(s,1650)):(O.position.copy(je).add(Me),O.target.position.copy(je));let a=r?k.lerp(n?240:680,65,i):34,o=O.shadow.camera;o.left=o.bottom=-a,o.right=o.top=a,o.far=r?3e3:360,O.shadow.bias=r?-45e-6:-15e-6,o.updateProjectionMatrix(),O.target.updateMatrixWorld(),O.updateMatrixWorld()},setQuality(e,n){Ne=e,Pe=n,De.setQuality(e,n),Oe.setQuality(e,n),ye.visible=e&&!Fe;let r=e?Fe&&!n&&Ie?768:1536:1024;t.shadowMap.type=3,O.shadow.mapSize.set(r,r),O.shadow.radius=Fe?n?1.8:1.55:1.3,O.shadow.blurSamples=Fe&&Ie?4:6,O.shadow.normalBias=Fe?.012:.018,O.shadow.map&&(O.shadow.map.dispose(),O.shadow.map=null)},setFloatingParkMode(n){Fe=n,ye.visible=Ne&&!n,W.visible=xe.visible=Ce.visible=!n,he.visible=!n,oe.visible=!n,O.shadow.mapSize.set(Ne?n&&!Pe&&Ie?768:1536:1024,Ne?n&&!Pe&&Ie?768:1536:1024),t.shadowMap.type=3,O.shadow.radius=n?1.55:1.3,O.shadow.blurSamples=n&&Ie?4:6,O.shadow.normalBias=n?.012:.018,O.shadow.map&&(O.shadow.map.dispose(),O.shadow.map=null),O.intensity=n?2.95:A,O.color.set(n?16766381:j),D.intensity=n?.48:F,N.intensity=n?.18:ne,te.intensity=n?.7:ie,e.environmentIntensity=n?.44:.4,e.fog instanceof h&&(e.fog.color.copy(n?new T(9023154):g),e.fog.density=n?42e-6:_),e.background instanceof T&&e.background.copy(n?new T(10405327):p),u.turbidity.value=n?2.25:d.turbidity,u.rayleigh.value=n?2.6:d.rayleigh,u.mieCoefficient.value=n?.002:d.mieCoefficient,u.mieDirectionalG.value=n?.78:d.mieDirectionalG,u.cloudCoverage.value=n?.62:d.cloudCoverage,u.cloudDensity.value=n?.58:d.cloudDensity},setFloatingParkFocus(e){if(Ie===e||(Ie=e,!Fe))return;let t=Ne&&!Pe?e?768:1536:1024;O.shadow.mapSize.set(t,t),O.shadow.blurSamples=e?4:6,O.shadow.map&&(O.shadow.map.dispose(),O.shadow.map=null)},setWaterEnabled(e){De.setEnabled(e),Oe.setEnabled(e)},dispose(){if(Ae)return;Ae=!0,Oe.dispose(),De.dispose(),w.dispose(),e.environment=null;let o=new Set;n.traverse(e=>{if(e instanceof G){o.add(e.geometry),e instanceof v&&e.dispose();for(let t of Array.isArray(e.material)?e.material:[e.material])i.add(t)}}),O.shadow.dispose(),t.shadowMap.type=Le,o.forEach(e=>e.dispose()),i.forEach(e=>e.dispose()),r.forEach(e=>e.dispose()),a.dispose(),n.removeFromParent(),n.clear()}}}var vt=class extends ge{segment;variant;phase=`warning`;heading;frame;warning;wasRolling=!1;cycle=-1;localTime=0;constructor(t,n,r,i,a,o=a){let s=Re[r].clone().lerp(Re[r+1],.55),l=new y(1.05,2),u=l.getAttribute(`position`);for(let e=0;e<u.count;e++){let t=u.getX(e),n=u.getY(e),r=u.getZ(e),i=1+Math.sin(t*9+r*7)*Math.cos(n*8)*.025;u.setXYZ(e,t*i,n*i,r*i)}l.computeVertexNormals(),super(t,n,{kind:`roller`,p:s.toArray(),size:[2.1,2.1,2.1],surface:`stone`},!0,!1,l,e.ColliderDesc.ball(1.05)),this.segment=r,this.variant=i,this.visual.material.dispose(),this.visual.material=o,this.visual.name=`Crossing boulder`,this.visual.castShadow=this.visual.receiveShadow=!0;let d=Re[r+1].clone().sub(Re[r]).normalize();this.heading=new b(0,1,0).cross(d).normalize();let f=d.clone().cross(this.heading).normalize();this.frame=new U().setFromRotationMatrix(new L().makeBasis(this.heading,f,d)),this.warning=new G(new z(9.4,.6),new W({color:16759892,transparent:!0,opacity:.48,depthWrite:!1})),this.warning.rotation.x=-Math.PI/2,this.warning.quaternion.premultiply(this.frame),this.warning.position.copy(s).addScaledVector(f,.055),n.add(this.warning),this.collider.setEnabled(!1);for(let e of[-1,1]){let t=new G(B(1.6,2.6,3.2,.16),a);t.quaternion.copy(this.frame),t.position.copy(s).add(new b(e*6.3,1.3,0).applyQuaternion(this.frame)),t.castShadow=t.receiveShadow=!0,n.add(t);let r=new G(B(1.8,.28,3.6,.08),new I({color:10060891,metalness:.55,roughness:.55}));r.quaternion.copy(this.frame),r.position.copy(t.position).addScaledVector(f,1.4),n.add(r);let i=this.frame.clone().multiply(new U().setFromAxisAngle(new b(0,1,0),-e*Math.PI/2)),o=new b(e*5.47,1.15,0).applyQuaternion(this.frame).add(s),l=new G(new c(1.11,32),new W({color:1515556}));l.quaternion.copy(i),l.position.copy(o),n.add(l);let u=new G(new H(1.2,.16,8,32),a);u.quaternion.copy(i),u.position.copy(o).addScaledVector(this.heading,-e*.045),u.castShadow=!0,n.add(u)}}update(e,t,n){let r=12+this.variant%3,i=(e+this.variant*2.3)%r,a=Math.floor((e+this.variant*2.3)/r),o=i>=1.65&&i<5.7;this.phase=i<1.65?`warning`:o?`rolling`:`rest`,this.localTime=i,this.warning.visible=i<5.7,this.warning.material.opacity=o?.16:.26+Math.sin(i*12)*.16,this.visual.visible=o||i<1.65;let s=(this.variant+a)%2==0?1:-1,c=k.clamp((i-1.65)/4.05,0,1),l=new b(s*(6.7-13.4*c),1.1,0).applyQuaternion(this.frame).add(this.origin);(!o||!this.wasRolling||a!==this.cycle)&&(this.body.setTranslation(l,!0),this.previous.copy(l),this.velocity.set(0,0,0)),this.collider.setEnabled(o),o&&this.move(l,t),this.wasRolling=o,this.cycle=a}sync(){super.sync(),this.visual.quaternion.copy(this.frame).multiply(new U().setFromAxisAngle(new b(0,0,1),this.localTime*3))}impact(e){if(this.phase===`rolling`){for(let t of e)if(t.active&&t.machine.invincible<=0&&this.contact(t)){t.impact=8.5;let e=t.current.clone().sub(this.visual.position).setY(.5).normalize().multiplyScalar(3.2);t.body.applyImpulse(e,!0)}}}},yt=class extends ge{segment;variant;phase=`warning`;heading;frame;warning;localTime=0;constructor(e,t,n,r,i){let a=Re[n].clone().lerp(Re[n+1],.5);super(e,t,{kind:`pusher`,p:a.toArray(),size:[5.6,1.15,.9],color:10978897,surface:`stone`},!0),this.segment=n,this.variant=r,this.visual.material.dispose(),this.visual.material=i,this.visual.name=`Aincrad brass deck sweeper`;let o=Re[n+1].clone().sub(Re[n]).normalize();this.heading=new b(0,1,0).cross(o).normalize();let s=o.clone().cross(this.heading).normalize();this.frame=new U().setFromRotationMatrix(new L().makeBasis(this.heading,s,o)),this.body.setRotation(this.frame,!0),this.visual.quaternion.copy(this.frame),this.warning=new G(new z(9.2,.45),new W({color:16766061,transparent:!0,opacity:.38,depthWrite:!1})),this.warning.rotation.x=-Math.PI/2,this.warning.quaternion.premultiply(this.frame),this.warning.position.copy(a).addScaledVector(s,.06),t.add(this.warning),this.collider.setEnabled(!1)}update(e,t,n){let r=10.5+this.variant%3*.7,i=(e+this.variant*1.8)%r;this.localTime=i,this.phase=i<1.35?`warning`:i<4.85?`active`:`rest`;let a=this.phase===`active`;this.warning.visible=i<4.85,this.warning.material.opacity=a?.13:.28+Math.sin(i*10)*.12;let o=k.clamp((i-1.35)/3.5,0,1),s=Math.sin(o*Math.PI)*6.4-3.2,c=this.origin.clone().addScaledVector(this.heading,s);a?this.move(c,t):(this.body.setTranslation(this.origin,!0),this.previous.copy(this.origin),this.velocity.set(0,0,0)),this.collider.setEnabled(a),this.visual.visible=i<4.85}sync(){super.sync(),this.visual.quaternion.copy(this.frame).multiply(new U().setFromAxisAngle(new b(0,0,1),this.localTime*1.8))}};function bt(e,t,n,r){let i=n.clone();i.color.set(8420716),i.roughness=.91,i.normalScale.set(.9,.9);let a=r.clone();a.color.set(9143670),a.roughness=.96,a.normalScale.set(1.2,1.2);let o=Array.from({length:36},(n,r)=>{let o=[3,15,29,47,67,83];return new vt(e,t,Math.floor(r/o.length)*96+o[r%o.length],r,i,a)}),s=Array.from({length:12},(n,r)=>{let a=[41,69];return new yt(e,t,Math.floor(r/a.length)*96+a[r%a.length],r,i)});return[...o,...s]}function xt(e,t){let n=0,r=new nt(e,()=>{let e=n*32;return`route ${e}-${e+32-1}`}),i=B(1,1,1,.1),a=tt(!0),o=t.clone();o.color.set(13024162),o.roughness=.87;let s=new I({color:8547653,metalness:.72,roughness:.4}),l=new I({color:3626580,metalness:.58,roughness:.62}),u=new I({color:3296860,side:2,roughness:1}),f=new z(1.2,3.5,6,14),p=f.getAttribute(`position`);for(let e=0;e<p.count;e++){let t=p.getY(e);p.setZ(e,Math.sin(t*3+p.getX(e)*3)*.12*(1.75-t)/3.5)}f.computeVertexNormals();let m=new d(1,12,8),h=new _e({color:5002575,roughness:.17,metalness:.12,clearcoat:1,clearcoatRoughness:.1,transparent:!0,opacity:.28,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-1}),g=new c(1,24),_=g.getAttribute(`position`);for(let e=1;e<_.count;e++){let t=1+Math.sin(e*2.8)*.1;_.setXY(e,_.getX(e)*t,_.getY(e)*t)}let v=(e,t,n)=>new b(e,t,n);for(let e=0;e<Re.length-1;e++){n=Math.floor(e/32);let t=Re[e],c=Re[e+1].clone().sub(t).normalize(),d=v(0,1,0).cross(c).normalize(),p=c.clone().cross(d).normalize(),_=new U().setFromRotationMatrix(new L().makeBasis(d,p,c)),y=e=>e.applyQuaternion(_).add(t),b=(e,t,n,i,a,o=_)=>r.add(e,t,n,y(i),a,o),x=e%96>=44&&e%96<=50;if(e%2==0)for(let e of[-1,1]){b(`Bridge corbels`,i,o,v(e*4.5,-2.6,0),v(.9,4.4,1.4));let t=_.clone().multiply(new U().setFromAxisAngle(v(0,0,1),.9));b(`Stone cantilever braces`,i,o,v(16,-10.5,e*1.5),v(1.5,31,1.8),t),b(`Bracket ornamental bosses`,m,s,v(e*4.5,-1.3,-.76),v(.23,.23,.15))}if(!x&&e%4==0){for(let e of[-1,1])b(`Gothic gateway piers`,i,o,v(e*5.85,3.3,0),v(1.35,6.6,1.6)),b(`Gateway stepped bases`,i,o,v(e*5.85,.3,0),v(1.9,.6,2.2)),b(`Gateway capitals`,i,o,v(e*5.85,6.2,0),v(1.9,.4,2.2)),b(`Route ceremonial banners`,f,u,v(e*6.05,3.8,1.03),v(1,1,1)),b(`Banner gilded arms`,i,s,v(e*6.05,5.6,1.05),v(1.6,.085,.12));b(`Open gothic bridge archways`,a,o,v(0,0,-.45),v(13.2,10.7,5)),b(`Arch bronze outer relief`,a,l,v(0,.12,.55),v(13.3,10.8,.65)),b(`Arch keystone medallions`,m,s,v(0,10.05,1.15),v(.48,.7,.15))}if(!x&&![7,23,39,71,87].includes(e%96)){let t=_.clone().multiply(new U().setFromAxisAngle(v(1,0,0),-Math.PI/2));b(`Scattered wet flagstone patches`,g,h,v(e%2?2:-1,.028,8),v(1.1,2.2,1),t)}if([7,23,39,71,87].includes(e%96)){let n=t.distanceTo(Re[e+1]);for(let e of[-2.1,2.1])for(let t of[-1,1])b(`Broken bridge warning inlays`,i,s,v(t*3.5,.06,n/2+e),v(1.2,.04,.22))}}r.finish()}function St(e,t){return e.geometries?.add(t),t}function Ct(e,t){return e.materials?.add(t),t}function wt(e,t){let n=[0];for(let t=1;t<e.length;t++)n.push(n[t-1]+e[t].distanceTo(e[t-1]));let r=n.at(-1)??0,i=r*t,a=1;for(;a<n.length&&n[a]<i;)a++;a=Math.min(a,e.length-1);let o=Math.max(0,a-1),s=Math.max(1e-4,n[a]-n[o]),c=(i-n[o])/s;return{position:e[o].clone().lerp(e[a],c),tangent:e[a].clone().sub(e[o]).normalize(),total:r}}function Tt(e,t,n,r,i={}){if(t.length<2)return;let a=t.map(e=>e.clone()),o=new P;o.name=`Floating route dressings · ${r}`,e.add(o);let s=Ct(i,new I({color:1522237,roughness:.7,metalness:.22})),l=Ct(i,new I({color:n,emissive:new T(n).multiplyScalar(.09),roughness:.55,metalness:.28})),u=Ct(i,new I({color:16770216,roughness:.42,metalness:.24})),d=St(i,B(.92,.09,1.16,.035)),f=St(i,B(.18,.055,1.8,.04)),p=St(i,new c(.62,3));p.rotateX(-Math.PI/2);let m=St(i,new V(.46,.6,1.15,12)),h=St(i,new H(.42,.075,6,18)),g=wt(a,.008),_=wt(a,.992),y=(e,t)=>{let n=Math.atan2(e.tangent.x,e.tangent.z),r=new b(e.tangent.z,0,-e.tangent.x);for(let i=-1;i<=1;i++)for(let a=-4;a<=4;a++){let c=new G(d,(i+a+ +!!t)%2==0?u:s);c.position.copy(e.position).addScaledVector(r,a*.9).addScaledVector(e.tangent,i*1.12).add(new b(0,.075,0)),c.rotation.y=n,c.castShadow=!1,c.receiveShadow=!0,c.name=`${t?`Finish`:`Start`} checker tile`,o.add(c)}};y(g,!1),y(_,!0);let x=Math.min(34,Math.max(10,Math.ceil(g.total/15))),S=new v(f,l,x*2);S.name=`Instanced alternating edge safety stripes`,S.castShadow=!1,S.receiveShadow=!0;let C=new v(p,u,Math.max(3,Math.min(9,Math.ceil(g.total/55))));C.name=`Instanced forward direction arrows`,C.castShadow=!1,C.receiveShadow=!1;let w=new L,E=new b,D=new U,O=new b(1,1,1);for(let e=0;e<x;e++){let t=wt(a,(e+.5)/x),n=new b(t.tangent.z,0,-t.tangent.x).normalize();D.setFromAxisAngle(new b(0,1,0),Math.atan2(t.tangent.x,t.tangent.z));for(let r of[-1,1])E.copy(t.position).addScaledVector(n,r*4.62).add(new b(0,.06,0)),w.compose(E,D,O),S.setMatrixAt(e*2+ +(r>0),w)}S.instanceMatrix.needsUpdate=!0,o.add(S);for(let e=0;e<C.count;e++){let t=wt(a,(e+1)/(C.count+1));E.copy(t.position).add(new b(0,.064,0)),D.setFromAxisAngle(new b(0,1,0),Math.atan2(t.tangent.x,t.tangent.z)),w.compose(E,D,O),C.setMatrixAt(e,w)}C.instanceMatrix.needsUpdate=!0,o.add(C);for(let[e,t]of[[.25,`25%`],[.5,`50%`],[.75,`75%`]]){let n=wt(a,e),r=new b(n.tangent.z,0,-n.tangent.x).normalize(),i=new G(m,l);i.position.copy(n.position).addScaledVector(r,5.4).add(new b(0,.58,0)),i.name=`Distance marker · ${t}`,i.castShadow=!0,i.receiveShadow=!0;let s=new G(h,u);s.position.copy(i.position).add(new b(0,.52,0)),s.rotation.x=Math.PI/2,s.name=`Distance marker beacon · ${t}`,o.add(i,s)}}var Et=32;function Dt(e){if(e.userData.aincradMetricUV)return;e.userData.aincradMetricUV=!0;let t=e.onBeforeCompile,n=e.customProgramCacheKey.bind(e)();e.onBeforeCompile=(n,r)=>{t.call(e,n,r),n.vertexShader=n.vertexShader.replace(`#include <common>`,`#include <common>
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
      #endif`)},e.customProgramCacheKey=()=>`${n}|aincrad-metric-stone-v1`,e.needsUpdate=!0}function Ot(e){let t=``;for(let[n,r]of[[100,`C`],[90,`XC`],[50,`L`],[40,`XL`],[10,`X`],[9,`IX`],[5,`V`],[4,`IV`],[1,`I`]])for(;e>=n;)t+=r,e-=n;return t}function kt(n,r,i,a=i){let o=new P;o.name=`Aincrad exterior spiral course`,o.userData.turns=ze.turns,o.userData.routeSegments=He,r.add(o),xt(o,i),Tt(o,Re,12163682,`浮遊城闖關`);let s=B(1,1,1,.12);Dt(i);let c=new I({color:4743006,metalness:.68,roughness:.52}),l=new I({color:11650237,metalness:.62,roughness:.42}),u=new I({color:16768672,emissive:16757583,emissiveIntensity:1.3,roughness:.28}),d=new Map;for(let[e,t]of[[i,`Instanced stone deck and balustrades`],[c,`Instanced patinated lantern frames`],[l,`Instanced silver route inlays`],[u,`Instanced lantern glass`]])d.set(e,{material:e,name:t,chunks:new Map});let f=0,p=new L,m=new b,h=new b,g=new U,_=new U,y=new U,x=new T(1,1,1),S=(e,t,n,r=y,i=x)=>{let a=d.get(e),o=a.chunks.get(f);if(!o){let t=f*Et;o={name:`${a.name} · route ${t}-${t+Et-1}`,material:e,matrices:[],sizes:[],colors:[]},a.chunks.set(f,o)}h.set(...n),o.matrices.push(p.compose(t,r,h).clone()),o.sizes.push(...n),o.colors.push(i.clone())},C=(e,t,n,r,i,a)=>{m.set(...r).applyQuaternion(n).add(t),_.copy(n),a&&_.multiply(a),S(e,m,i,_)},w=(r,i,a=y)=>n.createCollider(e.ColliderDesc.cuboid(i[0]/2,i[1]/2,i[2]/2).setTranslation(r.x,r.y,r.z).setRotation(a).setFriction(.65).setCollisionGroups(t.terrain)),E=Be.obstacles.map((e,t)=>{f=Math.floor(t/Et);let a=se(n,r,{...e,surface:`stone`});r.remove(a.visual),a.visual.geometry.dispose();for(let e of Array.isArray(a.visual.material)?a.visual.material:[a.visual.material])e.dispose();a.visual.geometry=s,a.visual.material=i,a.visual.scale.copy(a.size),a.visual.name=`Detached static obstacle reference`,g.copy(a.body.rotation());let o=a.size,c=o.y<.9;if(S(i,a.origin,[o.x,o.y,o.z],g,c?new T(.65,.72,.69):x),c||o.x>20)return a;let l=o.x<6,u=Math.max(.2,o.z-.16);for(let e of[-1,1]){let t=e*(o.x/2-.15);C(i,a.origin,g,[t,o.y/2+.095,0],[.3,.19,u]);let n=[.3,l?.19:1.08,u];if(m.set(t,o.y/2+n[1]/2,0).applyQuaternion(g).add(a.origin),w(m,n,g),l)continue;C(i,a.origin,g,[t,o.y/2+1.04,0],[.4,.2,u]);let r=Math.max(2,Math.ceil(u/3.4));for(let e=0;e<r;e++){let n=k.lerp(-u/2+.24,u/2-.24,e/(r-1));C(i,a.origin,g,[t,o.y/2+.53,n],[.21,.88,.21]),C(i,a.origin,g,[t,o.y/2+.2,n],[.38,.19,.38])}}return a}),D=new b(0,1,0),O=new b,A=new b,j=new b,M=new L,ee={I:[[0,-.35,0,.35]],V:[[-.2,.35,0,-.35],[0,-.35,.2,.35]],X:[[-.2,-.35,.2,.35],[-.2,.35,.2,-.35]],L:[[-.2,.35,-.2,-.35],[-.2,-.35,.2,-.35]],C:[[.2,.35,-.2,.35],[-.2,.35,-.2,-.35],[-.2,-.35,.2,-.35]]};for(let e=0;e<Re.length-1;e+=8){f=Math.floor(e/Et);let t=Re[e];O.subVectors(Re[e+1],t).normalize(),A.crossVectors(D,O).normalize();let n=O.clone().cross(A).normalize();g.setFromRotationMatrix(M.makeBasis(A,n,O));let r=e%ze.segmentsPerTurn,a=r>=44&&r<=50?2.3:ze.width/2;j.set(t.x,0,t.z).normalize();let o=t.clone().addScaledVector(j,a-.24),s=new U().setFromAxisAngle(D,Math.atan2(-j.x,-j.z));S(i,o.clone().add(new b(0,.25,0)),[.72,.5,.72],s),S(c,o.clone().add(new b(0,1.3,0)),[.14,2.1,.14],s),S(c,o.clone().add(new b(0,2.33,0)),[.7,.12,.7],s),S(u,o.clone().add(new b(0,2.72,0)),[.43,.64,.43],s);for(let e of[-.27,.27])for(let t of[-.27,.27])C(c,o,s,[e,2.72,t],[.055,.79,.055]);if(S(c,o.clone().add(new b(0,3.11,0)),[.72,.13,.72],s),w(o.clone().add(new b(0,1.2,0)),[.45,2.4,.45],s),e%16==0){let t=Ot(Math.max(1,Math.round(e/He*100)));C(c,o,s,[0,1.75,.24],[Math.max(.95,t.length*.32+.2),.76,.1]);let n=.65;for(let e=0;e<t.length;e++)for(let[r,i,a,c]of ee[t[e]]){let u=a-r,d=c-i,f=new U().setFromAxisAngle(new b(0,0,1),-Math.atan2(u,d));C(l,o,s,[(e-(t.length-1)/2)*.32+(r+a)*n/2,1.75+(i+c)*n/2,.302],[.035,Math.hypot(u,d)*n,.012],f)}}if(e>0)for(let e of[-1,1]){let n=new U().setFromAxisAngle(D,e*.62);C(l,t,g,[e*.22,.021,1.4],[.085,.018,.85],n)}}for(let e of d.values())for(let t of e.chunks.values()){let e=s.clone();e.setAttribute(`courseScale`,new Ce(new Float32Array(t.sizes),3));let n=new v(e,t.material,t.matrices.length);n.name=t.name,n.castShadow=t.material!==u,n.receiveShadow=!0;for(let e=0;e<t.matrices.length;e++)n.setMatrixAt(e,t.matrices[e]),n.setColorAt(e,t.colors[e]);n.instanceMatrix.needsUpdate=!0,n.instanceColor&&(n.instanceColor.needsUpdate=!0),n.computeBoundingSphere(),o.add(n)}let[N,te,F]=Be.finish,ne=new P;ne.name=`Summit silver and teal crystal altar`,ne.position.set(N,te-1,F),o.add(ne);let re=new I({color:8096130,roughness:.93}),ie=new G(new V(2.7,2.9,.18,48),re);ie.position.y=.09,ie.receiveShadow=!0,ne.add(ie),n.createCollider(e.ColliderDesc.cylinder(.09,2.8).setTranslation(N,te-.91,F).setCollisionGroups(t.terrain));for(let e of[1.65,2.6]){let t=new G(new H(e,.035,6,64),l);t.rotation.x=Math.PI/2,t.position.y=.2,ne.add(t)}let ae=new P;ae.name=`Aincrad summit crystal victory sensor`,ae.position.set(N,te,F),r.add(ae);let oe=new _e({color:9096132,roughness:.13,metalness:.08,clearcoat:1,clearcoatRoughness:.09,emissive:2052430,emissiveIntensity:.22}),ce=new G(new Te(.7),oe);ce.scale.set(.82,1.45,.82),ce.castShadow=!0,ae.add(ce);let le=new G(new H(1.05,.035,6,64),l);le.rotation.x=Math.PI/2+.25,ae.add(le);let ue=new Se(9360583,3,10,2);ue.position.y=1,ae.add(ue);let de=n.createCollider(e.ColliderDesc.ball(1).setTranslation(...Be.finish).setSensor(!0).setCollisionGroups(t.trigger));return{obstacles:[...E,...bt(n,r,i,a)],crown:{root:ae,collider:de},visual:o}}var At=Math.PI*2;function jt(e,t){return e.geometries.add(t),t}function Mt(e,t){return e.materials.add(t),t}function Nt(e,t,n,r={}){let i=e.clone();return i.color.set(n),r.roughness!==void 0&&(i.roughness=r.roughness),r.metalness!==void 0&&(i.metalness=r.metalness),Mt(t,i)}function Pt(e,t,n){e.onBeforeCompile=e=>{e.uniforms.floatingSurfaceSeed={value:n},e.vertexShader=`varying vec3 floatingSurfaceWorld;
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
       ${i}`)},e.customProgramCacheKey=()=>`floating-surface-detail-${t}`}function Ft(e,t,n){let r=e.zone===`water`?9087402:e.zone===`jungle`?10267011:e.zone===`volcanic`?6052956:e.zone===`mechanical`?9800310:e.zone===`castle`?11578780:11575427,i=e.zone===`volcanic`?8212293:13681824,a=e.zone===`volcanic`?3157813:e.zone===`water`?6322042:5792862,o=e.zone===`jungle`?7754811:e.zone===`water`?6310199:7229495,s=Mt(n,new _e({color:13233890,map:t.window.map,emissiveMap:t.window.emissiveMap,roughness:.14,metalness:.24,clearcoat:.72,clearcoatRoughness:.09,transmission:.08,thickness:.08,side:2}));s.emissive.set(e.color),s.emissiveIntensity=e.zone===`volcanic`?.72:.44,s.transparent=!0,s.opacity=.88;let c=Mt(n,new I({color:e.color,emissive:e.color,emissiveIntensity:2.3,roughness:.2,metalness:.18})),l=Mt(n,new _e({color:e.zone===`volcanic`?12406320:3058611,roughness:.1,metalness:.04,transmission:.18,clearcoat:.9,clearcoatRoughness:.08,transparent:!0,opacity:.78})),u=Nt(t.limestone,n,r,{roughness:.82}),d=Nt(t.stone,n,i,{roughness:.76}),f=Nt(t.rock,n,a,{roughness:.94}),p=Nt(t.rock,n,2179401,{roughness:.52,metalness:.24}),m=Mt(n,new I({color:e.zone===`water`?1526610:e.zone===`volcanic`?3284778:2439230,map:t.rock.map,normalMap:t.rock.normalMap,roughnessMap:t.rock.roughnessMap,normalScale:new _(.42,.42),emissive:e.color,emissiveIntensity:e.zone===`volcanic`?.22:.12,roughness:.46,metalness:.18})),h=Nt(t.bark,n,o,{roughness:.9}),g=Nt(t.bronze,n,3427915,{roughness:.42,metalness:.76}),v=Nt(t.gold,n,e.color,{roughness:.32,metalness:.72}),y=e.color%997;return Pt(u,`stone`,y+.1),Pt(d,`stone`,y+.2),Pt(f,`stone`,y+.3),Pt(p,`interior`,y+.4),Pt(m,`interior`,y+.5),Pt(h,`wood`,y+.6),Pt(g,`metal`,y+.7),Pt(v,`metal`,y+.8),{stone:u,stoneLight:d,rock:f,dark:p,interior:m,wood:h,metal:g,trim:v,window:s,glow:c,foliage:Nt(t.foliage,n,5078093,{roughness:1}),water:l}}function Y(e,t,n,r,i,a,o){let s=R(e,jt(t,n),r,i,a);return o&&s.rotation.set(...o),s}function X(e,t,n,r,i,a=.16,o){return Y(e,t,B(...r,a,1),n,i,void 0,o)}function Z(e,t,n,r,i,a,o=12,s,c){return Y(e,t,new V(r,r*1.06,i,o),n,a,s,c)}function It(e,t,n,r,i,a,o=3.1,s=2.15,c=!1){let l=X(e,t,n.window,c?[.16,s,o]:[o,s,.16],[r,i,a],.08);c&&(l.rotation.y=Math.PI/2);let u=n.trim;if(c){let n=[0,Math.PI/2,0];X(e,t,u,[.22,.2,o+.38],[r,i-s*.5-.1,a],.04,n),X(e,t,u,[.22,.2,o+.38],[r,i+s*.5+.1,a],.04,n),X(e,t,u,[.22,s+.38,.2],[r-o*.5-.1,i,a],.04,n),X(e,t,u,[.22,s+.38,.2],[r+o*.5+.1,i,a],.04,n)}else X(e,t,u,[o+.38,.2,.22],[r,i-s*.5-.1,a],.04),X(e,t,u,[o+.38,.2,.22],[r,i+s*.5+.1,a],.04),X(e,t,u,[.2,s+.38,.22],[r-o*.5-.1,i,a],.04),X(e,t,u,[.2,s+.38,.22],[r+o*.5+.1,i,a],.04);let d=c?X(e,t,n.metal,[.27,s,.12],[r,i,a],.03,[0,Math.PI/2,0]):X(e,t,n.metal,[.12,s,.27],[r,i,a],.03);return c&&(d.rotation.y=Math.PI/2),l}function Lt(e,t,n,r,i){let a=Z(e,t,n.glow,.28,.72,r,12);if(!e.userData.venueLight){let t=new Se(i,1.7,26,2);t.position.set(...r),t.castShadow=!1,e.userData.venueLight=t,e.add(t)}return a}function Rt(e,t,n,r,i,a=2.5,o=0){Z(e,t,n.wood,.22,a,[r,a/2+.2,i],8,[1,1,1],[.02,o,0]);for(let s=0;s<3;s++){let c=Y(e,t,new y(1,1),n.foliage,[r+Math.sin(o+s*2.1)*1.1,a+.3+s*.42,i+Math.cos(o+s)*.7],[1.15+s*.12,.75+s*.16,1.15+s*.12],[0,o+s,0]);c.castShadow=!0}}function Q(e,t,n,r,i,a,o,s,c=.42){let l=Math.sqrt((i*.52)**2+(a*.5)**2);for(let n of[-1,1])X(e,t,r,[l,.55,a],[n*i*.24,o,s],.12,[0,0,n*c]);X(e,t,n.trim,[i*.94,.28,a+.26],[0,o-.04,s],.06)}function zt(e,t,n,i){X(e,t,n.dark,[14.8,.24,10.2],[0,1.45,2.1],.06),X(e,t,n.interior,[12.9,.12,8.2],[0,1.62,2],.04),X(e,t,n.stoneLight,[13.8,.16,1.05],[0,1.63,-1.45],.04);for(let r of[-4.8,-2.4,0,2.4,4.8])X(e,t,n.trim,[.12,.07,8.2],[r,1.75,2.35],.02);X(e,t,n.dark,[13.8,.22,9.3],[0,9,2.1],.06),X(e,t,n.stone,[14.6,6.4,.28],[0,4.55,7.05],.06),X(e,t,n.interior,[7.8,4.8,.2],[0,4.65,6.86],.05),X(e,t,n.window,[5.8,1.05,.12],[0,6.85,6.69],.04),X(e,t,n.trim,[6.15,.12,.2],[0,7.42,6.61],.03);for(let r of[-2.65,2.65])X(e,t,n.window,[1.7,2,.14],[r,4.95,6.7],.04),X(e,t,n.trim,[1.95,.14,.2],[r,6.02,6.64],.03);It(e,t,n,-4.1,5.55,6.82,2.3,1.55),It(e,t,n,4.1,5.55,6.82,2.3,1.55);let a=e.userData.venueLight;a&&(a.position.set(0,5.6,3.1),a.intensity=2.2,a.distance=30);for(let r of[-7.1,7.1])X(e,t,n.stoneLight,[.62,6.4,.62],[r,4.55,1.5],.08),X(e,t,n.trim,[.22,6.1,.72],[r,4.55,1.1],.04);for(let r of[-1,1])X(e,t,n.wood,[2.8,.42,.72],[r*4.9,2.35,2.2],.06),X(e,t,n.trim,[2.95,.16,.14],[r*4.9,2.62,2.2],.03),X(e,t,n.wood,[.24,1,.24],[r*4.9,2,1.82],.03);X(e,t,n.wood,[7.6,.68,1.15],[0,2.45,.15],.07),X(e,t,n.trim,[6.8,.12,.18],[0,2.82,-.43],.03),X(e,t,n.window,[3.8,.72,.08],[0,2.98,-.46],.02);for(let r of[-4.3,4.3])Z(e,t,n.metal,.11,2.6,[r,2.82,.7],10),Z(e,t,n.trim,.24,.12,[r,4.14,.7],10);for(let r=0;r<4;r++)X(e,t,n.stoneLight,[8.8+r*1.6,.25,.7],[0,1.62+r*.24,-2.8+r*.82],.05);for(let r of[-5.1,5.1])Lt(e,t,n,[r,5.8,.2],n.glow.color.getHex()),X(e,t,n.trim,[.18,3.1,.18],[r,7.05,2.2],.03);for(let r of[-3,0,3])Lt(e,t,n,[r,6.9,2.9],n.glow.color.getHex());for(let r of[-4.2,0,4.2])X(e,t,n.metal,[.24,.24,10.6],[r,8.74,2.05],.03);switch(i){case`gate`:case`maze`:for(let r of[-3.2,-1.6,0,1.6,3.2])X(e,t,n.trim,[.26,4.2,.38],[r,3.8,4.7],.03);X(e,t,n.metal,[8,.28,.45],[0,5.9,4.7],.03);break;case`waterfall`:case`water`:case`canal`:X(e,t,n.stoneLight,[10.6,.55,.9],[0,2.2,4.5],.08),X(e,t,n.water,[4.3,.12,.55],[0,2.55,4],.06);for(let r of[-4.2,4.2])Z(e,t,n.water,.22,4.4,[r,4,4.4],10);break;case`boulder`:for(let r of[-4.1,0,4.1])Y(e,t,new g(1.15,1),n.rock,[r,2.65,4.6],[1.3,1,1.1]);X(e,t,n.wood,[11.2,.55,.55],[0,5.8,4.6],.08);break;case`bridge`:case`vine`:for(let r of[-1,1])X(e,t,n.wood,[.46,4.8,.46],[r*4.6,4,4.5],.06),X(e,t,n.wood,[9.8,.28,.32],[0,6.1,4.5],.05);for(let r of[-3.4,-1.7,0,1.7,3.4])X(e,t,n.wood,[1.2,.22,2.8],[r,2,4.5],.04,[0,0,Math.sin(r)*.12]);break;case`temple`:case`statue`:for(let r of[-4.5,4.5])Z(e,t,n.stoneLight,.68,4.8,[r,4,4.7],14),Z(e,t,n.trim,.86,.22,[r,6.48,4.7],14);X(e,t,n.trim,[10.2,.42,.65],[0,6.8,4.7],.06),Y(e,t,new Te(1,1),n.glow,[0,4,4.4],[1.15,1.4,.68]);break;case`volcano`:for(let i of[-3.8,3.8])Y(e,t,new r(1.35,4.4,8),n.rock,[i,3.5,4.4],[1,1,1]),Z(e,t,n.glow,.62,.16,[i,5.78,4.4],16);X(e,t,n.glow,[.32,.2,5.2],[0,2,4.4],.03,[.06,0,0]);break;case`mine`:case`construction`:for(let r of[-1,1])X(e,t,n.metal,[.34,5.2,.34],[r*5.1,4.1,4.5],.04),X(e,t,n.trim,[.25,.25,10.5],[r*5.1,6.35,2.3],.03);X(e,t,n.metal,[10.8,.3,.3],[0,6.35,4.5],.03),Lt(e,t,n,[0,6,4.2],16758875);break;case`tree`:Z(e,t,n.wood,1.15,6.2,[0,4,4.3],14,[1,1,1.25]);for(let r of[-1,1])X(e,t,n.wood,[4.6,.46,.54],[r*2.3,2.4,4.2],.08,[0,r*.12,r*.2]);Y(e,t,new y(2.3,1),n.foliage,[0,7.2,4.4],[1.5,.7,1.2]);break;case`observatory`:Z(e,t,n.metal,2,.26,[0,2,4.6],24),Z(e,t,n.trim,.22,5.2,[0,4.6,4.6],10,void 0,[.1,0,-.25]),Y(e,t,new d(1.15,16,10),n.window,[0,6.2,4.6],[1.1,.36,1.1]);break;case`cave`:Y(e,t,new H(3,.48,10,28,Math.PI),n.rock,[0,4.2,4.5],[1.2,1.1,1]),X(e,t,n.dark,[5.8,4,.28],[0,3,4.55],.05);for(let i of[-2,0,2])Y(e,t,new r(.34,1.2,7),n.glow,[i,6.5,4.2],[1,1,1],[Math.PI,0,0]);break;case`beast`:Y(e,t,new d(1.8,18,12),n.rock,[0,5.1,4.4],[1.45,1.1,1]);for(let i of[-1,1])Y(e,t,new r(.42,2.2,8),n.trim,[i*1.65,6.6,4.4],[1,1,1],[0,0,i*.28]);break;case`harbor`:X(e,t,n.wood,[10.6,.32,2.4],[0,2,4.5],.04);for(let r of[-1,1])Z(e,t,n.wood,.16,5.3,[r*3.8,4.4,4.4],8);X(e,t,n.trim,[8,.22,.22],[0,6.9,4.4],.03);break;case`finale`:X(e,t,n.trim,[11.4,.4,.7],[0,6.9,4.7],.05);for(let r of[-4.8,-2.4,2.4,4.8])Z(e,t,n.stoneLight,.45,5.2,[r,4.1,4.7],12);Y(e,t,new Te(1.2,1),n.glow,[0,5.2,4.1],[1.25,1.45,.75]);break;case`castle`:for(let r of[-4.3,4.3])X(e,t,n.stoneLight,[1.2,5.5,1.2],[r,4.2,4.4],.08);X(e,t,n.trim,[10.5,.5,.9],[0,7.2,4.4],.06)}}function Bt(e,t,n,i){let a=-3.55;switch(i){case`gate`:for(let r of[-1,1])Z(e,t,n.stoneLight,1.2,9,[r*7.2,5.2,a],16),Z(e,t,n.trim,1.42,.32,[r*7.2,9.8,a],16);X(e,t,n.trim,[17.8,1,1],[0,9.15,a],.1);for(let r of[-2.05,2.05])Z(e,t,n.trim,.14,4.8,[r,4,-3.67],10),Y(e,t,new Te(.42,1),n.glow,[r,6.2,-3.73],[1,1.2,.35]);break;case`temple`:Q(e,t,n,n.trim,22,8,11.3,-.1,.28);for(let r of[-8.2,-4.1,4.1,8.2])Z(e,t,n.stoneLight,.82,8,[r,5.2,a],14);X(e,t,n.trim,[21,.7,.9],[0,9,a],.08);break;case`maze`:for(let r of[-9,-6,6,9])X(e,t,n.stoneLight,[2,6.2,2],[r,4.2,a],.12);for(let r of[-8.2,-5.2,5.2,8.2])X(e,t,n.trim,[1,1,1],[r,8.1,a],.08);X(e,t,n.dark,[6.4,5.4,.24],[0,4.35,-3.67],.06);break;case`statue`:case`beast`:for(let i of[-1,1])X(e,t,n.rock,[3.4,5.8,3],[i*7.6,3.9,a],.2),Y(e,t,new d(1.55,16,12),n.stoneLight,[i*7.6,8,a],[1.15,1.15,1]),Y(e,t,new r(.55,2.8,8),n.trim,[i*7.6,10,a],[1,1,1],[0,0,i*.28]);break;case`bridge`:Q(e,t,n,n.wood,23,10,11.1,1.8,.38);for(let r of[-1,1])X(e,t,n.wood,[.7,9.6,.7],[r*9.4,5.2,a],.08),X(e,t,n.wood,[4.8,.42,.42],[r*7,8.4,a],.05);break;case`vine`:Q(e,t,n,n.wood,24,12,10.8,1.4,.5);for(let r of[-1,1]){Z(e,t,n.wood,.58,10,[r*9.5,5.7,a],12);let i=Y(e,t,new H(3.2,.2,10,36),n.foliage,[r*8.1,6.4,-3.83],[1,1.3,1]);i.rotation.y=r*.2}break;case`tree`:for(let r of[-1,1])Z(e,t,n.wood,1.1,9.4,[r*7.7,5.2,a],14,[1.2,1,1]),X(e,t,n.wood,[9.8,1.3,1],[0,9.2,a],.12);Y(e,t,new y(4.7,2),n.foliage,[0,13,.8],[1.8,.65,1.1]);break;case`waterfall`:X(e,t,n.stoneLight,[22,1,1],[0,9.1,a],.1);for(let r of[-8.5,8.5]){X(e,t,n.stone,[3,8.2,2.6],[r,4.7,a],.12);let i=Y(e,t,new z(3.1,7.4,8,12),n.water,[r,4.2,-3.75]);i.userData.waterSheet=!0}break;case`water`:case`canal`:for(let r of[-1,1])Z(e,t,n.stoneLight,.75,8.6,[r*8.6,5,a],14),X(e,t,n.trim,[5.6,.48,.9],[r*5,8.9,a],.06);X(e,t,n.water,[7.4,.18,2.8],[0,1.65,-3.9],.12);break;case`harbor`:Q(e,t,n,n.wood,24,13,10.8,1.2,.33);for(let r of[-1,1])Z(e,t,n.wood,.24,11,[r*10.2,5.7,a],10),X(e,t,n.trim,[4.6,.28,.28],[r*7.5,8.6,a],.04);X(e,t,n.wood,[13,.7,3.2],[0,1.8,-3.15],.08);break;case`cave`:Y(e,t,new H(5,1.15,14,40,Math.PI),n.rock,[0,6,a],[1.35,1.18,1]),X(e,t,n.dark,[11.2,6.4,.3],[0,3,-3.6999999999999997],.08);for(let i of[-1,1])Y(e,t,new r(.55,2.2,8),n.glow,[i*3.8,7.2,-3.83],[1,1,1],[Math.PI,0,0]);break;case`volcano`:for(let i of[-1,1])Y(e,t,new r(3.8,9,8),n.rock,[i*7,4.8,a],[1,1,.9],[.08,i*.15,0]),Z(e,t,n.glow,1.1,.16,[i*7,9.4,a],18);break;case`mine`:case`construction`:for(let r of[-1,1])X(e,t,n.metal,[.65,10.5,.65],[r*9.8,5.8,a],.08),X(e,t,n.trim,[9.2,.5,.55],[r*5.2,10,a],.06,[0,0,r*.2]);X(e,t,n.dark,[8.2,5.8,.26],[0,4,-3.65],.06);break;case`observatory`:Z(e,t,n.stoneLight,5.5,.35,[0,10.2,-.8],32),Y(e,t,new d(5.1,24,16,0,At,0,Math.PI/2),n.window,[0,10.3,-.8],[1,.66,1]),Z(e,t,n.trim,5.5,.24,[0,10.32,-.8],32),X(e,t,n.metal,[.28,.28,11],[0,13.5,-.8],.04,[Math.PI/2,0,.2]);break;case`boulder`:for(let r of[-1,1])Y(e,t,new g(3.5,1),n.rock,[r*7,3.7,a],[1.15,1.35,.92],[.1,r*.2,0]);X(e,t,n.wood,[12,.65,1],[0,8.6,a],.08);break;case`finale`:case`castle`:for(let r of[-9.2,-4.6,4.6,9.2])Z(e,t,n.stoneLight,.78,9.2,[r,5.1,a],14);X(e,t,n.trim,[22,.85,1],[0,9.2,a],.08),Y(e,t,new Te(2,1),n.glow,[0,12.2,a],[1.2,1.6,.8])}}function Vt(e,t,n){for(let r=0;r<4;r++)X(e,t,n.stoneLight,[12+r*2.2,.28,1.55],[0,.28+r*.28,-4.8+r*.9],.08)}function Ht(e,t,n){for(let r of[-15,-10.5,10.5,15])It(e,t,n,r,3.8,-2.48,3.1,2.1),It(e,t,n,r,7,-2.48,2.4,1.55);for(let r of[-1,1])for(let i of[2,7,12])It(e,t,n,r*20.2,4.2,i,2.55,1.8,!0)}function Ut(e,t,n,r){for(let r of[-1,1])Z(e,t,n.stoneLight,1.02,7.8,[r*6.1,4.6,-2.9],16),Z(e,t,n.trim,1.25,.32,[r*6.1,8.6,-2.9],16);let i=Y(e,t,new Te(1.5,1),n.glow,[0,11.8,-1.2],[1.2,1.5,.7]);if(e.userData.dynamics=[{mesh:i,rate:.22}],r===`gate`||r===`finale`)for(let r of[-1,1]){X(e,t,n.trim,[.38,9.4,.38],[r*18,5,-2.5],.08);let i=Y(e,t,new z(2.8,5.2,2,4),n.glow,[r*18,5.2,-2.65]);i.userData.wave=r,(e.userData.dynamics??=[]).push({mesh:i,rate:r*.24})}}function Wt(e,t,n,r){for(let r of[-1,1])X(e,t,n.wood,[.55,9.3,.55],[r*11.6,5,-2.9],.12,[0,0,r*.16]),X(e,t,n.wood,[11.8,.5,.55],[0,8.5,-2.9],.12,[0,0,r*.02]);Rt(e,t,n,-18,-1.5,3.8,.2),Rt(e,t,n,18,-1.5,4.5,2.4);for(let r of[-1,1]){let i=Y(e,t,new H(2.3,.13,8,28,Math.PI*1.25),n.foliage,[r*15,6.2,-2.75],[1,1.5,1],[0,r*.22,0]);(e.userData.dynamics??=[]).push({mesh:i,rate:r*.2})}if(r===`tree`){Z(e,t,n.wood,2.7,10,[0,5.5,9],14,[1.25,1,1.25]),Y(e,t,new y(5.6,2),n.foliage,[0,11,9],[1.45,.85,1.45]);for(let r of[0,Math.PI/2,Math.PI,Math.PI*1.5])X(e,t,n.wood,[.42,.42,7],[Math.cos(r)*5,4,9+Math.sin(r)*5],.08,[0,r,0])}}function Gt(e,t,n,r){for(let r of[-1,1]){let i=X(e,t,n.water,[9.5,.18,5.4],[r*13,.36,8.4],.35);i.renderOrder=1;for(let i of[6.8,8.8,10.8]){let a=Y(e,t,new H(1.3,.08,8,24),n.glow,[r*13,.5,i],[1.2,.7,.6],[Math.PI/2,0,0]);(e.userData.dynamics??=[]).push({mesh:a,rate:.12+r*.05})}}if(r===`waterfall`||r===`cave`)for(let r of[-1,1]){let i=Y(e,t,new z(4.2,8.5,8,16),n.water,[r*9.6,4.4,.2],void 0,[0,Math.PI,0]);(e.userData.dynamics??=[]).push({mesh:i,rate:r*.18})}if(r===`canal`||r===`harbor`){X(e,t,n.water,[12,.16,17],[0,.34,9],.28);for(let r of[-1,1]){X(e,t,n.wood,[1.1,.6,20],[r*8.5,.62,8],.12);for(let i of[1,6,11,16])Z(e,t,n.wood,.25,2.8,[r*8.5,1.2,i],8)}}}function Kt(e,t,n){for(let r of[-1,1])Y(e,t,new g(3.8,1),n.rock,[r*14,3.4,8],[1.1,1.25,.9],[.1,r*.25,.2]),X(e,t,n.glow,[.22,4.8,.22],[r*13.1,3.1,4.5],.06,[.16,r*.25,.18]);let r=Y(e,t,new H(6.2,.2,8,40),n.glow,[0,.5,8],[1,.62,1],[Math.PI/2,0,0]);(e.userData.dynamics??=[]).push({mesh:r,rate:.32})}function qt(e,t,n,r){for(let r of[-1,1])X(e,t,n.metal,[.75,11,.75],[r*18,5.8,8],.12),X(e,t,n.metal,[36,.72,.72],[0,10.8,8],.12),Z(e,t,n.trim,1.25,.26,[r*11,8.8,-2.8],16,void 0,[Math.PI/2,0,0]);if(r===`construction`){X(e,t,n.metal,[1.2,16,1.2],[13,8.4,10],.15),X(e,t,n.trim,[21,.7,.7],[2.5,15.5,10],.12,[0,0,-.12]);let r=Z(e,t,n.metal,.1,8,[3,11.5,8],8,void 0,[0,0,Math.PI/2]);r.rotation.z=Math.PI/2,Lt(e,t,n,[3,7.3,8],16759896)}if(r===`mine`){for(let r of[-1,1]){X(e,t,n.wood,[.4,.4,19],[r*2,.7,8],.06);for(let r of[1,5,9,13,17])X(e,t,n.metal,[6,.32,.32],[0,1,r],.04)}Z(e,t,n.glow,1.25,.18,[0,2.4,-1],20,void 0,[Math.PI/2,0,0])}}function Jt(e,t,n){let r=Y(e,t,new d(5.8,24,16,0,At,0,Math.PI/2),n.window,[7.2,13,9.5],[.92,.5,.92]);r.material=n.window,Z(e,t,n.trim,5.5,.35,[7.2,10.15,9.5],32);let i=Y(e,t,new H(5.8,.22,10,42),n.glow,[7.2,13,9.5],[.92,.5,.92]);i.rotation.x=Math.PI/2,(e.userData.dynamics??=[]).push({mesh:i,rate:.16}),X(e,t,n.metal,[.34,.34,9],[7.2,13.8,9.5],.05,[Math.PI/2,0,.18])}function Yt(e,t,n){let r=Y(e,t,new H(7,1.35,12,36,Math.PI),n.rock,[0,5.1,-3.1],[1.2,1.1,1],[0,0,0]);r.rotation.x=Math.PI/2,X(e,t,n.dark??n.rock,[11,6,.35],[0,2.8,-3.1],.08);for(let r of[-1,1])Y(e,t,new Te(.9,1),n.glow,[r*8,3.8,-3.5],[1,2.1,1])}function Xt(e,t,n,r,i,a=.11){let o=new b(...n),s=new b(...r),c=s.clone().sub(o),l=c.length(),u=o.clone().add(s).multiplyScalar(.5),d=Z(e,t,i,a,l,[u.x,u.y,u.z],8);return d.quaternion.setFromUnitVectors(new b(0,1,0),c.normalize()),d}function Zt(e,t,n,i){let a=-3.25;switch(X(e,t,n.stoneLight,[38.5,.18,.28],[0,1.88,a],.03),X(e,t,n.trim,[15.5,.12,.36],[0,1.98,-3.57],.02),X(e,t,n.stoneLight,[40.2,.28,.52],[0,9.55,-2.72],.05),i){case`gate`:case`finale`:case`castle`:{Q(e,t,n,n.stoneLight,27,13,13.05,3.4,.34),Q(e,t,n,n.trim,22,7,10.85,a,.24);let r=Y(e,t,new H(5,.48,12,36,Math.PI),n.trim,[0,5.45,-3.63]);r.rotation.y=Math.PI;for(let r of[-1,1])Z(e,t,n.stoneLight,.78,8.8,[r*10.4,4.95,a],14),X(e,t,n.trim,[4.8,.24,.42],[r*7.9,9.3,a],.03);break}case`temple`:Q(e,t,n,n.trim,35,18,13.4,4.5,.3),Q(e,t,n,n.stoneLight,27,10,10.65,a,.28);for(let r of[-12.5,-6.2,6.2,12.5])Z(e,t,n.stoneLight,.58,8.7,[r,4.9,a],14),Z(e,t,n.trim,.78,.22,[r,9.35,a],14);X(e,t,n.trim,[28,.3,.64],[0,10,a],.04);break;case`maze`:Q(e,t,n,n.rock,31,16,12.7,4.5,.46);for(let r of[-15,-10,10,15])X(e,t,n.stoneLight,[2.2,6.8,2.2],[r,4.8,a],.12),X(e,t,n.trim,[2.6,.38,2.6],[r,8.35,a],.05);X(e,t,n.dark,[7.2,5.8,.3],[0,4.35,-3.47],.05);for(let r of[-3.2,3.2])X(e,t,n.trim,[.28,6.2,.36],[r,4.2,-3.65],.03);break;case`statue`:case`beast`:Q(e,t,n,n.rock,30,17,12.8,4.8,.34);for(let i of[-1,1]){let o=X(e,t,n.rock,[4.8,4.6,3.2],[i*8.8,3.1,a],.22);o.rotation.z=i*.06,Y(e,t,new d(1.45,16,12),n.stoneLight,[i*8.8,7,-3.35],[1.25,1.35,1]),Y(e,t,new r(.5,2.8,8),n.trim,[i*8.8,9,-3.35],[1,1,1],[0,0,i*.22])}break;case`bridge`:case`vine`:case`tree`:Q(e,t,n,n.wood,36,19,13.3,4.8,.48),Q(e,t,n,n.foliage,25,9,10.65,a,.32);for(let r of[-1,1])X(e,t,n.wood,[.56,10.2,.56],[r*12.2,5.35,a],.08),X(e,t,n.wood,[11.6,.44,.5],[0,9.25,a],.06);if(i===`bridge`||i===`vine`)for(let r of[-8,-4,4,8])X(e,t,n.wood,[.28,6.1,.28],[r,4,-3.5300000000000002],.04,[0,0,r*.012]);break;case`waterfall`:{Q(e,t,n,n.stoneLight,33,18,13,4.8,.3);let r=Y(e,t,new H(5.2,.42,10,34,Math.PI),n.water,[0,5.35,-3.69]);r.rotation.y=Math.PI;for(let r of[-1,1]){X(e,t,n.stone,[4.4,7.2,3],[r*10.5,4.6,a],.18);let i=Y(e,t,new z(3.5,7,6,14),n.water,[r*10.5,4,-3.6]);i.userData.waterSheet=!0}X(e,t,n.trim,[24,.34,.7],[0,9.25,a],.04);break}case`water`:case`canal`:case`harbor`:{Q(e,t,n,n.trim,34,18,13,5,.3);let r=Y(e,t,new H(5.1,.42,10,34,Math.PI),n.trim,[0,5.25,-3.71]);r.rotation.y=Math.PI;for(let r of[-1,1])Z(e,t,n.stoneLight,.82,8.4,[r*11.5,4.8,a],14),X(e,t,n.water,[3.8,.18,9.4],[r*7.5,1.8,-2.35],.08);if(i===`harbor`)for(let r of[-1,1])X(e,t,n.wood,[.32,11,.32],[r*15.4,5.5,a],.04),X(e,t,n.trim,[4.6,.18,.18],[r*12.7,9.4,a],.02);break}case`volcano`:Q(e,t,n,n.rock,31,17,12.6,5,.36);for(let i of[-1,1])Y(e,t,new r(2,7.2,8),n.rock,[i*11.2,4.3,a],[1,1,1],[.08,i*.14,0]),Z(e,t,n.glow,.62,.18,[i*11.2,8,a],16);X(e,t,n.glow,[.28,.22,15.5],[0,2.3,1],.03,[.06,0,0]);break;case`mine`:case`construction`:Q(e,t,n,n.metal,35,19,13.1,5,.18);for(let r of[-1,1])X(e,t,n.metal,[.58,12,.58],[r*15.5,6.1,a],.06),X(e,t,n.trim,[8.2,.32,.32],[r*11.4,10.2,a],.03,[0,0,r*.2]);X(e,t,n.trim,[22,.32,.38],[0,11,a],.03);for(let r of[-1,1])X(e,t,n.trim,[7.5,.24,.26],[r*4.7,6.8,-3.57],.03,[0,0,r*.34]),X(e,t,n.metal,[7.5,.24,.26],[r*4.7,5,-3.61],.03,[0,0,r*-.28]);i===`construction`&&(X(e,t,n.metal,[.7,15.2,.7],[13.5,8,8],.08),X(e,t,n.trim,[19,.42,.42],[4,14.5,8],.04,[0,0,-.14]));break;case`observatory`:{Q(e,t,n,n.stoneLight,28,17,12.6,5,.2);let r=Y(e,t,new d(5.1,24,14,0,At,0,Math.PI/2),n.window,[0,12,-.75],[1,.56,1]);r.userData.observatoryDome=!0,Z(e,t,n.trim,5,.25,[0,10.18,-.75],28),X(e,t,n.metal,[.3,.3,9.5],[0,14.2,-.75],.03,[Math.PI/2,0,.18]);break}case`cave`:case`boulder`:{Q(e,t,n,n.rock,31,18,12.5,4.8,.52);let o=Y(e,t,new H(6.4,1.25,14,40,Math.PI),n.rock,[0,5,-3.4],[1.25,1.1,1]);o.rotation.y=Math.PI;for(let r of[-6.8,6.8])Y(e,t,new g(2,1),n.rock,[r,3,a],[1.2,1.5,1]);if(i===`cave`)for(let i of[-3.4,0,3.4])Y(e,t,new r(.42,2.2,8),n.glow,[i,7,-3.6],[1,1,1],[Math.PI,0,0]);break}}}function Qt(e,t,n,i){let a=-3.82,o=n.glow.color.getHex(),s=(r,i,o,s=n.trim)=>{let c=1.98;X(e,t,s,[.42,o,.62],[r-i*.5,c+o*.5,a],.06),X(e,t,s,[.42,o,.62],[r+i*.5,c+o*.5,a],.06);let l=Y(e,t,new H(i*.5,.3,10,32,Math.PI),s,[r,c+o,a]);l.rotation.y=Math.PI,X(e,t,n.glow,[.12,o-.7,.08],[r-i*.5+.24,c+o*.5,-4.16],.02),X(e,t,n.glow,[.12,o-.7,.08],[r+i*.5-.24,c+o*.5,-4.16],.02)},c=(r,i,o,s=n.stoneLight)=>X(e,t,s,[i,.34,.72],[r,o,a],.05),l=(r,i,a=.72,o=2.6,s=n.window)=>{It(e,t,n,r,i,-3.9,a,o),X(e,t,n.trim,[a+.32,.14,.34],[r,i+o*.5+.16,-4.04],.03)},u=(r,i,a,o=n.glow)=>{let s=Z(e,t,o,a,.22,[r,i,-4.24],20,void 0,[Math.PI/2,0,0]);return s.castShadow=!0,s};switch(i){case`gate`:case`finale`:case`castle`:s(0,5.8,6.6,n.trim),s(-8,3.7,5,n.stoneLight),s(8,3.7,5,n.stoneLight),c(0,7.6,9.12,n.trim),u(0,8.18,1.15);for(let e of[-13.4,-10.8,10.8,13.4])l(e,5,.62,2.8);for(let r of[-5,5])Lt(e,t,n,[r,7.2,-4.32],o);break;case`temple`:for(let r of[-13,-8.6,-4.3,4.3,8.6,13])Z(e,t,n.stoneLight,.62,8.3,[r,5.9,a],16),Z(e,t,n.trim,.82,.2,[r,10.1,a],16);c(0,31,10.25,n.trim),s(0,6.2,6.2,n.stoneLight),u(0,8,1.65,n.trim);for(let e of[-10.8,-6.2,6.2,10.8])l(e,6.3,1.2,2.5);break;case`maze`:for(let r of[-15.5,15.5]){X(e,t,n.rock,[3.2,9.8,3.2],[r,6.8,a],.14);for(let e of[5.1,7.5,9.9])l(r,e,.52,1,n.trim)}s(0,6.4,6.4,n.rock),c(0,9.4,9.1,n.trim);for(let e of[-12,-8,8,12])l(e,5,.56,2.4);break;case`statue`:case`beast`:for(let r of[-1,1])X(e,t,n.rock,[4.4,5.4,3.8],[r*9.3,4.2,a],.22),Y(e,t,new g(1.55,1),n.stoneLight,[r*9.3,8,-4.02],[1.2,1.5,1]);s(0,7.4,6.7,n.trim);for(let r of[-1,1])u(r*9.3,8.35,.78,n.glow),Lt(e,t,n,[r*4.3,7,-4.32],o);if(i===`beast`){u(0,11.5,.58,n.glow);for(let i of[-2.2,-.75,.75,2.2])Y(e,t,new r(.18,.95,8),n.stoneLight,[i,4.35,-4.37],[1,1,1],[Math.PI,0,0])}break;case`bridge`:case`vine`:case`tree`:{let r=i===`tree`?11.4:10.2;for(let i of[-1,1])Xt(e,t,[i*12.5,2,a],[i*7.5,r,a],n.wood,.22),Xt(e,t,[i*7.5,2,a],[i*12.5,r,a],n.wood,.18),Lt(e,t,n,[i*5.2,7.3,-4.22],o);s(0,6.4,6.1,n.wood),c(0,15.2,r+.2,n.wood);for(let e of[-10.8,-8,8,10.8])l(e,5.8,1,2.5,n.window);if(i===`vine`||i===`tree`)for(let r of[-1,1]){let i=Y(e,t,new H(2.4,.14,8,28,Math.PI*1.3),n.foliage,[r*11.8,6.5,-4.17],[1,1.25,1]);i.rotation.y=r*.18}break}case`waterfall`:for(let r of[-1,1]){X(e,t,n.stone,[4,8.8,3.6],[r*10.8,5.5,a],.18),s(r*10.8,2.1,5.4,n.trim);let i=Y(e,t,new z(2.2,6.7,6,14),n.water,[r*10.8,4.2,-4.2]);i.userData.waterSheet=!0}s(0,7.1,6.8,n.stoneLight),c(0,18,9.3,n.trim);for(let e of[-5.8,5.8])l(e,6,1.3,2.7);break;case`water`:case`canal`:case`harbor`:for(let e of[-10,0,10])s(e,4,5.2,i===`harbor`?n.wood:n.stoneLight);c(0,27,8.6,n.trim);for(let e of[-13.2,-6.5,6.5,13.2])l(e,5.2,1.15,2.3);X(e,t,n.water,[19,.16,1.1],[0,2,-4.27],.05);for(let r of[-8,8])Lt(e,t,n,[r,7.1,-4.27],o);i===`harbor`&&(Xt(e,t,[-12,2.1,-4.32],[-5.5,10.8,-4.32],n.wood,.2),Xt(e,t,[12,2.1,-4.32],[5.5,10.8,-4.32],n.wood,.2));break;case`volcano`:for(let r of[-1,1]){X(e,t,n.rock,[5.1,9.6,3.8],[r*10.2,5.3,a],.16);for(let i of[3.2,5.2,7.2])X(e,t,n.glow,[.16,1.35,.08],[r*10.2,i,-4.32],.02,[0,0,r*.14])}s(0,7,6.6,n.rock),c(0,19,9.15,n.trim);for(let r of[-5.5,5.5])Lt(e,t,n,[r,7.1,-4.3],16746312);break;case`mine`:case`construction`:for(let r of[-1,1])Xt(e,t,[r*13.4,2,a],[r*8,11.4,a],n.metal,.24),Xt(e,t,[r*8,2,a],[r*13.4,11.4,a],n.metal,.18);s(0,7.8,6.4,n.metal),c(0,22,10.55,n.trim);for(let e of[-10.8,-7.2,7.2,10.8])l(e,5.4,1.1,2.3,n.window);for(let r of[-4.6,4.6])Lt(e,t,n,[r,7.2,-4.32],16759896);break;case`observatory`:Z(e,t,n.stoneLight,5.8,.32,[0,2.05,a],32);for(let r of[-4.5,-2.25,2.25,4.5])Z(e,t,n.trim,.32,6.8,[r,5.3,a],12);s(0,6.2,5.8,n.trim),u(0,8.2,1,n.window);for(let e of[-10.6,10.6])l(e,5.3,1.2,2.4);break;case`cave`:case`boulder`:{let i=Y(e,t,new H(5.7,1,14,42,Math.PI),n.rock,[0,7.1,a],[1.35,1.2,1]);i.rotation.y=Math.PI,X(e,t,n.dark,[8.6,5.2,.25],[0,4,-3.6199999999999997],.05);for(let i of[-4.7,-2.2,2.2,4.7])Y(e,t,new r(.34,1.8,7),n.glow,[i,6.7,-4.24],[1,1,1],[Math.PI,0,0]),l(i,9,.6,1.3,n.trim);break}}}function $t(e,t,n,i){let a=10.8,o=(r,i,a=n.trim)=>X(e,t,a,[4.8,.26,4.8],[r,13.3,i],.06),s=(r,i,a,o=n.glow)=>Y(e,t,new Te(.85,1),o,[r,i,a],[1.1,1.8,1.1]),c=(r,i,a,o,s=n.window)=>{let c=Y(e,t,new H(o,.16,8,24,Math.PI),n.trim,[r,i,a]);c.rotation.y=Math.PI,X(e,t,s,[o*1.55,o*1.7,.12],[r,i-o*.48,a],.04)};switch(i){case`gate`:case`finale`:case`castle`:X(e,t,n.stone,[18,5.4,10],[0,11,a],.18),Q(e,t,n,n.stoneLight,20,11,14,a,.34);for(let r of[-1,1]){X(e,t,n.stoneLight,[5.2,12.8,5.2],[r*13.2,7,a],.18),o(r*13.2,a,n.trim);for(let i of[-1.05,1.05])X(e,t,n.trim,[.42,.8,.9],[r*13.2+i,13,10.700000000000001],.04);s(r*13.2,15,a)}s(0,16,a,n.trim);break;case`temple`:X(e,t,n.stone,[31,3.3,8.5],[0,9.7,a],.12),Q(e,t,n,n.trim,34,10,13,a,.26),Q(e,t,n,n.stoneLight,25,8,15,11,.22);for(let r of[-11,-5.5,5.5,11])Z(e,t,n.stoneLight,.56,5.8,[r,12,9.600000000000001],14),c(r,13.9,9.3,.78);s(0,16.4,a,n.trim);break;case`maze`:for(let r of[-1,1]){X(e,t,n.rock,[6.4,13.5,6.4],[r*12.6,7.2,a],.2),o(r*12.6,a,n.stoneLight);for(let i of[-1.7,0,1.7])X(e,t,n.trim,[.92,.72,.92],[r*12.6+i,13.8,a],.06)}X(e,t,n.stone,[19,6.2,3.2],[0,5.4,12.4],.14);for(let e of[-7.2,-3.6,3.6,7.2])c(e,7.1,10.75,.8,n.trim);break;case`statue`:case`beast`:{X(e,t,n.rock,[20,7.5,7],[0,6.2,a],.22),Q(e,t,n,n.rock,23,8,11,a,.34);for(let r of[-1,1])Z(e,t,n.stoneLight,.72,7,[r*7,6.6,7.9],16),Z(e,t,n.trim,.92,.22,[r*7,10.2,7.9],16);let o=Y(e,t,i===`beast`?new d(2.15,18,12):new g(2,1),i===`beast`?n.rock:n.stoneLight,[0,13.1,10.3],i===`beast`?[1.5,1,1.18]:[1.1,1.35,.85]);if(o.userData.highlight=!0,i===`beast`)for(let i of[-1,1])Y(e,t,new r(.45,2.4,8),n.trim,[i*1.9,14.6,10.4],[1,1,1],[0,0,i*.28]);break}case`bridge`:case`vine`:case`tree`:for(let r of[-1,1])X(e,t,n.wood,[1,14,1],[r*14.2,7,a],.12),X(e,t,n.wood,[4.8,.8,1],[r*12,13.1,a],.08),Xt(e,t,[r*14.2,2,8],[r*7,12.4,8],n.wood,.24),Xt(e,t,[r*7,2,8],[r*14.2,12.4,8],n.wood,.18);if(X(e,t,n.wood,[27,.7,.86],[0,13.4,a],.08),i===`tree`)Z(e,t,n.wood,3.1,12.5,[0,6.6,12.4],16,[1.2,1,1.2]),Y(e,t,new y(5.4,2),n.foliage,[0,14.2,12.4],[1.5,.72,1.5]);else for(let r of[-1,1]){let i=Y(e,t,new H(2.6,.16,8,28,Math.PI*1.35),n.foliage,[r*11.5,8.3,10.3],[1,1.25,1]);i.rotation.y=r*.2}break;case`waterfall`:X(e,t,n.stone,[22,8.2,6.4],[0,6.1,a],.16),Q(e,t,n,n.stoneLight,25,8,11.3,a,.28);for(let r of[-1,1]){let i=Y(e,t,new z(3.2,7.2,8,16),n.water,[r*7.1,5,7.6000000000000005]);i.userData.waterSheet=!0,X(e,t,n.trim,[3.8,.22,.54],[r*7.1,8.55,7.300000000000001],.04)}for(let e of[-4.5,0,4.5])c(e,7.1,7.550000000000001,.86);break;case`water`:case`canal`:case`harbor`:X(e,t,n.stone,[32,5.4,5],[0,5,a],.14);for(let r of[-12,-6,0,6,12])Z(e,t,n.stoneLight,.72,6.4,[r,6.4,8.600000000000001],14),c(r,9.9,8.25,.72,n.window);if(X(e,t,n.trim,[35,.48,5.8],[0,9.9,a],.06),i===`harbor`)for(let r of[-1,1])X(e,t,n.wood,[.7,14,.7],[r*15.5,7,12],.08),Xt(e,t,[r*15.5,13.5,12],[0,16.5,12],n.wood,.2);break;case`volcano`:{Y(e,t,new r(7.8,13,10),n.rock,[0,6.5,a],[1.2,1,.92]);let i=Y(e,t,new H(4.2,.34,8,32),n.glow,[0,13.1,a],[1.25,.72,1],[Math.PI/2,0,0]);(e.userData.dynamics??=[]).push({mesh:i,rate:.24});for(let i of[-1,1])Y(e,t,new r(2,6,8),n.rock,[i*9,3,11.600000000000001],[1,1,.86]),s(i*9,6.3,11.600000000000001,n.glow);break}case`mine`:case`construction`:for(let r of[-1,1])X(e,t,n.metal,[.8,16,.8],[r*15.5,8,a],.08),Xt(e,t,[r*15.5,15.2,a],[0,18,a],n.metal,.24),Xt(e,t,[r*15.5,2,a],[0,15.2,a],n.trim,.16);X(e,t,n.metal,[27,.7,.7],[0,12,a],.06);for(let r of[-8,0,8])X(e,t,n.window,[5.8,4.2,.12],[r,7.2,10.65],.03);i===`construction`&&(X(e,t,n.trim,[.72,20,.72],[12,9.8,12.600000000000001],.08),Xt(e,t,[12,18.5,12.600000000000001],[-2,18.5,12.600000000000001],n.trim,.2));break;case`observatory`:Z(e,t,n.stone,7.3,8.6,[0,5.6,a],28),Z(e,t,n.trim,7.6,.34,[0,9.95,a],28),Y(e,t,new d(6.9,28,18,0,At,0,Math.PI/2),n.window,[0,10.1,a],[1,.62,1]),Z(e,t,n.trim,6.9,.26,[0,10.15,a],28),X(e,t,n.metal,[.34,.34,12],[0,15.2,a],.04,[Math.PI/2,0,.18]);break;case`cave`:case`boulder`:for(let r of[-1,1])Y(e,t,new g(4.2,1),n.rock,[r*9.5,4.3,a],[1.35,1.6,1.15],[.12,r*.22,.08]),Y(e,t,new g(3.1,1),n.stone,[r*4.5,5,12],[1.2,1.35,.9],[.08,r*.18,.04]);if(Y(e,t,new H(6.5,1.15,14,40,Math.PI),n.rock,[0,8.4,9.3],[1.35,1.05,1]),i===`cave`)for(let i of[-3.8,-1.3,1.3,3.8])Y(e,t,new r(.42,2.8,8),n.glow,[i,10,8.600000000000001],[1,1,1],[Math.PI,0,0])}}function en(e,t,n,i){let a=-4.08;for(let r of[2.35,4.55,6.75,8.95]){for(let[i,o]of[[-15,7],[-7.2,4.5],[7.2,4.5],[15,7]])X(e,t,n.stone,[o,.075,.26],[i,r,a],.018);for(let i of[-1,1])X(e,t,n.stoneLight,[1.12,.48,.62],[i*19.75,r+.22,-4.13],.045)}for(let r of[-15,-10.5,10.5,15])for(let i of[3.8,7])X(e,t,n.trim,[3.7,.12,.34],[r,i-1.32,-4.26],.025),X(e,t,n.stoneLight,[3.45,.12,.42],[r,i+1.22,-4.24],.025);switch(i){case`gate`:case`finale`:case`castle`:for(let r of[-10.5,-7,-3.5,3.5,7,10.5])X(e,t,n.trim,[1,.72,.72],[r,10.25,a],.06);for(let r of[-8.8,8.8])Xt(e,t,[r,2,-4.3],[r,9.4,-4.3],n.stoneLight,.12);break;case`temple`:for(let r of[-13.2,-8.8,-4.4,0,4.4,8.8,13.2])X(e,t,n.trim,[2.25,.18,.48],[r,10.48,-4.2],.035);for(let r of[11.3,12.3,13.3])Z(e,t,n.glow,.52,.1,[0,r,-4.42],16,void 0,[Math.PI/2,0,0]);break;case`maze`:for(let r of[-1,1]){for(let i of[3,5.2,7.4,9.6])X(e,t,n.rock,[2.7,.42,.58],[r*15.5,i,-4.26],.04);for(let i of[r*12.4,r*8.9])X(e,t,n.trim,[.22,2,.38],[i,5.4,-4.36],.03)}break;case`statue`:case`beast`:for(let r of[-6.8,-4.5,-2.2,2.2,4.5,6.8])Y(e,t,new g(.38,1),n.trim,[r,9.45,-4.4],[1.2,.8,.5]);if(i===`beast`)for(let i of[-1,1])Y(e,t,new r(.32,1.8,8),n.trim,[i*2.1,5,-4.58],[1,1,1],[0,0,i*.3]);break;case`bridge`:case`vine`:case`tree`:for(let r of[-1,1])X(e,t,n.trim,[.34,.34,4.8],[r*6.2,6.15,-4.34],.035),Xt(e,t,[r*9.8,2.5,-4.42],[r*6.2,8.8,-4.42],n.wood,.14);i===`tree`&&Y(e,t,new y(3,1),n.foliage,[0,12.4,-3.2800000000000002],[1.7,.56,.9]);break;case`waterfall`:case`water`:case`canal`:case`harbor`:for(let r of[-12.5,-8.3,8.3,12.5])X(e,t,n.stoneLight,[.32,6.2,.34],[r,4.8,-4.34],.035),X(e,t,n.water,[2.8,.13,.42],[r*.72,2.25,-4.5],.025);if(i===`harbor`)for(let r of[-1,1])Xt(e,t,[r*5,2.2,-4.6],[r*12,8.2,-4.6],n.wood,.15);break;case`volcano`:for(let r of[-1,1]){for(let i of[3,5,7])X(e,t,n.glow,[.12,1,.1],[r*10.2,i,-4.54],.02,[0,0,r*.16]);X(e,t,n.rock,[4.2,.18,.38],[r*10.2,2.28,-4.34],.03)}break;case`mine`:case`construction`:for(let r of[-1,1]){for(let i of[3,5,7,9])Z(e,t,n.trim,.16,.12,[r*15,i,-4.42],8,void 0,[Math.PI/2,0,0]);for(let i of[r*5,r*7.5])X(e,t,n.glow,[1.7,.12,.08],[i,4.2,-4.48],.02,[0,0,r*.35])}break;case`observatory`:{let r=Y(e,t,new H(3.9,.18,8,36),n.trim,[0,9.9,-4.42],[1,.7,1]);r.rotation.x=Math.PI/2;for(let r of[-4.8,4.8])Z(e,t,n.glow,.42,.18,[r,6.2,-4.44],14,void 0,[Math.PI/2,0,0]);break}case`cave`:case`boulder`:for(let a of[-1,1]){for(let r of[3,5,7])X(e,t,n.rock,[4.6,.22,.5],[a*8.8,r,-4.36],.08,[0,0,a*.08]);i===`cave`&&Y(e,t,new r(.28,1.6,7),n.glow,[a*4,7.6,-4.6],[1,1,1],[Math.PI,0,0])}}}function tn(e,t,n,i){for(let r of[-4.8,0,4.8])X(e,t,n.window,[3.65,2.55,.16],[r,5.15,6.55],.04),X(e,t,n.trim,[3.9,.12,.24],[r,6.5,6.43],.03),X(e,t,n.glow,[2.65,.1,.08],[r,4,6.3999999999999995],.02);for(let r of[-4.8,0,4.8])Lt(e,t,n,[r,7.25,3.5],n.glow.color.getHex());switch(i){case`bridge`:case`vine`:case`tree`:for(let r of[-1,1])Xt(e,t,[r*6.5,2,.8],[r*3,7.8,5.9],n.wood,.16);break;case`waterfall`:case`water`:case`canal`:case`harbor`:X(e,t,n.water,[8.8,.14,2.1],[0,2.05,4.9],.06);for(let r of[-1,1])Z(e,t,n.trim,.2,4.4,[r*3.9,4.1,4.9],10);break;case`mine`:case`construction`:for(let r of[-1,1])Xt(e,t,[r*5.8,2,3.9],[r*2.2,7.7,6],n.metal,.14),X(e,t,n.trim,[2.2,.16,.12],[r*4.8,6.15,6.2],.02);break;case`observatory`:{let r=Z(e,t,n.metal,.26,5.8,[0,4.3,4.6],12,void 0,[.16,0,-.22]);r.rotation.z=-.24;break}case`volcano`:for(let r of[-4.8,0,4.8])X(e,t,n.glow,[.24,2.5,.1],[r,4.9,6.35],.02,[0,0,r*.015]);break;case`cave`:case`boulder`:for(let i of[-4.2,0,4.2])Y(e,t,new r(.3,1.45,7),n.glow,[i,6.95,5.9],[1,1,1],[Math.PI,0,0])}}function nn(e,t,n,i){for(let r of[-5.8,-2.9,0,2.9,5.8])X(e,t,n.wood,[.28,.32,7.1],[r,8.42,2.55],.035),X(e,t,n.trim,[.62,.08,6.7],[r,8.22,2.55],.018);for(let r of[-4.8,-2.4,0,2.4,4.8])X(e,t,n.trim,[1.3,.08,.9],[r,1.83,3],.02),X(e,t,n.glow,[.64,.055,.06],[r,2.02,3],.014);switch(X(e,t,n.wood,[3.6,.65,1.25],[0,3,5.5],.07),X(e,t,n.trim,[3.25,.08,1],[0,3.36,5.5],.02),Y(e,t,new Te(.58,1),n.glow,[0,4.15,5.5],[1,1.28,.72]),i){case`gate`:case`finale`:case`castle`:for(let r of[-1,1])X(e,t,n.trim,[.18,5.2,.18],[r*6,5.7,5.9],.02);break;case`temple`:for(let r of[-4.5,0,4.5])X(e,t,n.glow,[2.8,.08,.08],[r,6.9,6.48],.015);break;case`bridge`:case`vine`:case`tree`:for(let r of[-1,1])Xt(e,t,[r*6,2,2.4],[r*3,7.8,6],n.wood,.13);break;case`waterfall`:case`water`:case`canal`:case`harbor`:X(e,t,n.water,[5.8,.1,.55],[0,4.15,5.9],.02);for(let r of[-2.4,2.4])Z(e,t,n.water,.15,2.8,[r,5.4,5.9],10);break;case`volcano`:for(let r of[-4.2,0,4.2])X(e,t,n.glow,[.11,2.1,.07],[r,5.3,6.4],.02,[0,0,r*.025]);break;case`mine`:case`construction`:for(let r of[-1,1])Xt(e,t,[r*5.6,2,3.4],[r*2.4,7.8,6],n.metal,.12);break;case`observatory`:{let r=Y(e,t,new H(1.25,.12,8,24),n.trim,[0,4.5,5.55]);r.rotation.x=Math.PI/2;break}case`cave`:case`boulder`:for(let i of[-3.8,0,3.8])Y(e,t,new r(.24,1.1,7),n.glow,[i,5.8,6.1],[1,1,1],[Math.PI,0,0])}}function rn(e,t,n,i){let a=[[-17,5.8],[-10.9,3.6],[-5.9,2],[5.9,2],[10.9,3.6],[17,5.8]];for(let[r,i,o]of[[.93,0,n.stone],[1.29,-.12,n.stoneLight]])for(let[n,s]of a)X(e,t,o,[s,.18,.72],[n,r,-4.58+i],.045);X(e,t,n.stoneLight,[17.8,.14,3.1],[0,1.78,-4.04],.035),X(e,t,n.dark,[11.7,.075,1.55],[0,1.88,-4.56],.035);for(let r of[-7.8,-5.2,-2.6,2.6,5.2,7.8])X(e,t,n.trim,[.08,.04,2.45],[r,1.91,-4.03],.012);for(let r of[-8.8,0,8.8])X(e,t,n.stone,[7.2,.045,.08],[r,1.93,-4.08],.012);X(e,t,n.dark,[14.2,.13,2.55],[0,10.02,-3.72],.035),X(e,t,n.stoneLight,[16.4,.38,3.25],[0,10.32,-3.82],.08),X(e,t,n.trim,[17.1,.16,3.5],[0,10.57,-3.84],.045);for(let r of[-7.1,-3.55,3.55,7.1])Z(e,t,n.stoneLight,.42,7.7,[r,5.22,-3.62],14),Z(e,t,n.trim,.55,.18,[r,9.03,-3.62],14),X(e,t,n.stone,[1.18,.18,1.12],[r,1.98,-3.62],.04);for(let r of[-1,1]){for(let i of[-1.2,4.2,9.6])X(e,t,n.stoneLight,[.34,6.8,1.05],[r*20.55,5.15,i],.06),X(e,t,n.trim,[.46,.18,1.32],[r*20.5,8.62,i],.035);X(e,t,n.stone,[3.8,.28,1],[r*18.7,10.02,-1.2],.05),X(e,t,n.trim,[4.2,.11,1.18],[r*18.7,10.24,-1.2],.03),X(e,t,n.stoneLight,[3.8,.28,1],[r*18.7,10.02,10.3],.05)}for(let r of[-1,1])X(e,t,n.stone,[3.6,.92,2.5],[r*21.8,1.38,-4.08],.12),X(e,t,n.trim,[3.15,.12,2.08],[r*21.8,1.9,-4.08],.04),Rt(e,t,n,r*21.8,-4.08,3.1,r*.65);switch(i){case`gate`:case`finale`:case`castle`:Q(e,t,n,n.stoneLight,18.5,4.6,11.15,-3.48,.24);for(let r of[-1,1])X(e,t,n.trim,[2.5,.18,.62],[r*7.1,11.18,-5.46],.035);break;case`temple`:for(let[r,i,a]of[[23,10.98,-3.3],[20.5,11.32,-3.05],[18,11.66,-2.8]])X(e,t,n.stoneLight,[r,.24,1.15],[0,i,a],.045),X(e,t,n.trim,[r+.42,.09,1.3],[0,i+.17,a-.05],.025);break;case`bridge`:case`vine`:case`tree`:Q(e,t,n,n.wood,19.2,5.1,11,-3.35,.42);for(let r of[-1,1])Xt(e,t,[r*8.3,2.05,-4.15],[r*6.2,9.9,-4.15],n.wood,.18),X(e,t,n.trim,[1.45,.22,1.25],[r*7.1,10.36,-3.8],.04);if(i!==`tree`)for(let r of[-1,1]){let i=Y(e,t,new H(2,.14,8,28,Math.PI*1.25),n.foliage,[r*8.6,6.7,-4.25],[1,1.1,1]);i.rotation.y=r*.18}break;case`waterfall`:case`water`:case`canal`:case`harbor`:X(e,t,n.stone,[18.6,.34,4.9],[0,9.74,-3.05],.08),X(e,t,n.trim,[19.2,.12,5.25],[0,9.98,-3.08],.035),X(e,t,n.water,[10.4,.12,1.2],[0,2.02,-4.74],.035);for(let r of[-1,1])Z(e,t,n.stoneLight,.3,4.7,[r*8.1,4.1,-4.35],12);break;case`volcano`:X(e,t,n.rock,[17.6,.36,3.6],[0,10.25,-3.66],.1),X(e,t,n.glow,[12.8,.08,.16],[0,10.08,-5.3],.025);for(let r of[-1,1])Xt(e,t,[r*7,2.1,-4.35],[r*5.1,9.9,-4.35],n.rock,.28);break;case`mine`:case`construction`:X(e,t,n.metal,[18.4,.28,3.8],[0,10.3,-3.7],.055);for(let r of[-1,1]){Xt(e,t,[r*8.2,2.05,-4.3],[r*6.1,10.4,-4.3],n.metal,.2);for(let i of[3.4,5.2,7,8.8])Z(e,t,n.trim,.13,.55,[r*8.2,i,-4.52],8,void 0,[Math.PI/2,0,0])}break;case`observatory`:Z(e,t,n.trim,8.4,.22,[0,10.66,-3],32),X(e,t,n.metal,[.3,.3,18],[0,13.1,-3],.04,[Math.PI/2,0,.18]);for(let r of[-1,1])Z(e,t,n.stoneLight,.3,5.5,[r*7,6,-3],12);break;case`cave`:case`boulder`:Y(e,t,new H(6.3,.74,12,36,Math.PI),n.rock,[0,9.8,-4.05],[1.35,1,1]);for(let i of[-1,1])Y(e,t,new g(1.15,1),n.rock,[i*8,8.7,-4.18],[1.4,1.1,.8]),Y(e,t,new r(.25,1.5,7),n.glow,[i*4.2,7.8,-4.66],[1,1,1],[Math.PI,0,0])}}function an(e,t,n,r){X(e,t,n.dark,[19.6,.14,.16],[0,9.64,-3.06],.025);for(let r of[-8.8,-6,6,8.8])X(e,t,n.dark,[.12,3.55,.14],[r,5,-4.77],.018);for(let r of[-1,1]){for(let i of[2.35,3.9,5.45,7,8.55])X(e,t,n.rock,[8.25,.075,.13],[r*14.2,i,-2.64],.016);for(let i of[.05,3.1,6.15,9.2,12.25])X(e,t,n.stoneLight,[.13,.72,1.18],[r*19.36,5.1,i],.02)}for(let r of[-9.7,-4.9,4.9,9.7])X(e,t,n.stoneLight,[3.7,.1,.3],[r,4,-4.84],.018),X(e,t,n.trim,[3.45,.06,.12],[r,4.13,-4.97],.012);switch(r){case`gate`:case`finale`:case`castle`:case`temple`:for(let r of[-6.8,-3.4,0,3.4,6.8])X(e,t,n.trim,[2.2,.08,.22],[r,10.84,-4.949999999999999],.018),X(e,t,n.dark,[1.65,.07,.11],[r,10.69,-5.01],.012);break;case`bridge`:case`vine`:case`tree`:for(let r of[-1,1]){for(let i of[3,5.2,7.4])X(e,t,n.wood,[1.45,.16,.18],[r*7.1,i,-4.93],.022);X(e,t,n.trim,[.24,5.5,.18],[r*9.9,5.35,-4.949999999999999],.022)}break;case`waterfall`:case`water`:case`canal`:case`harbor`:for(let r of[-7.8,-3.9,3.9,7.8])X(e,t,n.water,[2.25,.09,.16],[r,2.24,-5.01],.018),X(e,t,n.stoneLight,[.18,3.8,.22],[r,5.1,-4.989999999999999],.02);break;case`volcano`:for(let r of[-7.4,-3.7,3.7,7.4])X(e,t,n.rock,[2,.12,.24],[r,3.1,-5.01],.026),X(e,t,n.glow,[.08,1.9,.08],[r,6.1,-5.069999999999999],.012);break;case`mine`:case`construction`:for(let r of[-1,1])for(let i of[2.8,4.4,6,7.6])Z(e,t,n.trim,.14,.08,[r*9.5,i,-5.01],8,void 0,[Math.PI/2,0,0]);break;case`observatory`:for(let r of[-.55,-.18,.18,.55]){let i=Math.sin(r)*8.5;X(e,t,n.metal,[1.3,.1,.22],[i,9.7,-4.989999999999999],.02,[0,r,0])}break;case`cave`:case`boulder`:for(let r of[-1,1])X(e,t,n.rock,[3.4,.16,.3],[r*6.7,3,-4.949999999999999],.06),X(e,t,n.glow,[.1,1.4,.08],[r*4.3,6.5,-5.109999999999999],.018)}}function on(e,t){let n=new Set;e.userData.dynamics?.forEach(({mesh:e})=>n.add(e));let r=new P,i=new Set;for(let t of[...e.children])t instanceof G&&!n.has(t)&&(t.removeFromParent(),r.add(t),i.add(t.geometry));if(r.children.length!==0){De(r);for(let t of[...r.children])e.add(t);i.forEach(e=>{t.geometries.delete(e),e.dispose()})}}function sn(e,t,n,i){X(e,t,n.stone,[44,.8,28],[0,.4,6],.28),X(e,t,n.stoneLight,[40,.8,24],[0,1.15,6],.22),X(e,t,n.stone,[10.5,5.8,17],[-14.2,3.9,6],.2),X(e,t,n.stone,[10.5,5.8,17],[14.2,3.9,6],.2),X(e,t,n.stoneLight,[19,8.2,4.6],[0,5.35,9.5],.28);for(let i of[-1,1])X(e,t,n.stoneLight,[5.1,9.2,5.1],[i*18.6,5.35,5.8],.22),Y(e,t,new r(1,1,4),n.trim,[i*18.6,11.7,5.8],[2.7,1.1,2.7],[0,Math.PI/4,0]);Y(e,t,new r(1,1,4),n.trim,[0,11.8,6],[10.8,1.12,8.8],[0,Math.PI/4,0]),Vt(e,t,n),X(e,t,n.stoneLight,[23.5,.42,2.9],[0,10.25,-2.65],.1),X(e,t,n.trim,[22.2,.16,3.15],[0,10.5,-2.65],.04);for(let r of[-3.1,3.1])X(e,t,n.trim,[.45,6.5,.55],[r,4,-2],.1);let a=Y(e,t,new H(3.2,.34,10,32,Math.PI),n.trim,[0,6.9,-2.05]);a.rotation.y=Math.PI;for(let r of[-10.5,10.5])X(e,t,n.trim,[.45,6.4,.55],[r,4.1,-2.4],.1);Ht(e,t,n),X(e,t,n.stoneLight,[14,.5,4.8],[0,8.8,-1],.12);for(let r of[-6,-3,3,6])Z(e,t,n.trim,.13,1.5,[r,9.65,-2.7],8),Z(e,t,n.trim,.13,1.5,[r,9.65,.2],8);switch(Lt(e,t,n,[-4.3,4.1,-2.7],16762475),Lt(e,t,n,[4.3,4.1,-2.7],16762475),Lt(e,t,n,[0,8.1,-2.9],n.glow.color.getHex()),Rt(e,t,n,-20,-4,3.1,.4),Rt(e,t,n,20,-4,3.6,2.1),zt(e,t,n,i),tn(e,t,n,i),nn(e,t,n,i),Bt(e,t,n,i),Zt(e,t,n,i),Qt(e,t,n,i),$t(e,t,n,i),en(e,t,n,i),rn(e,t,n,i),an(e,t,n,i),i){case`gate`:case`temple`:case`maze`:case`statue`:case`beast`:case`finale`:case`castle`:Ut(e,t,n,i);break;case`bridge`:case`vine`:case`tree`:Wt(e,t,n,i);break;case`waterfall`:case`water`:case`canal`:case`harbor`:Gt(e,t,n,i);break;case`cave`:Gt(e,t,n,i),Yt(e,t,n);break;case`volcano`:Kt(e,t,n);break;case`mine`:case`construction`:qt(e,t,n,i);break;case`observatory`:Jt(e,t,n);break;case`boulder`:for(let r of[-1,1])Y(e,t,new g(3,1),n.rock,[r*15,2.8,9],[1.2,.9,1.1],[.1,r*.35,.12])}return e}function cn(e,t,n,r){let i=new P;i.name=`Floating attraction building · ${n.publicName}`,i.userData.attractionId=n.id,i.userData.pattern=n.pattern,i.userData.building=!0,i.position.z=-15,i.rotation.y=Math.PI,e.add(i);let a=Ft(n,r,t),o=new P;o.name=`Merged architectural shell and facade details`,i.add(o),sn(o,t,a,n.pattern),on(o,t);let s=new ce().setFromObject(o).getSize(new b);return i.userData.architecturePartCount=o.children.length,i.userData.architectureSize=s.toArray(),i.userData.detailTier=`complete-shell-facade-roof-landscaping-massing-interior-depth-micro-v19`,i.userData.facadeCraft=!0,i.userData.massing=!0,i.userData.interiorCraft=!0,i.userData.constructionDepth=!0,i}function ln(e,t,n){let r=new P;r.name=`Floating City reflective lagoon and water garden`,e.add(r);let i=new Me;i.absellipse(0,0,115,70,0,Math.PI*2,!1,0);let a=new te(i,64);t.geometries.add(a);let o={name:`Floating lagoon scene reflection with turquoise water tint`,uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},time:{value:0}},vertexShader:`uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorldPosition; varying vec3 vWorldNormal;
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
      }`},l=[],u=6,f=(e,t,n,i,a=0)=>{let s=new it(e,{textureWidth:n,textureHeight:n,clipBias:.003,multisample:0,color:10148818,shader:o});s.name=i,(Array.isArray(s.material)?s.material:[s.material]).forEach(e=>{e.depthWrite=!1,e.depthTest=!0}),s.position.set(...t),s.rotation.x=-Math.PI/2,s.renderOrder=1;let c=s.onBeforeRender,d=a;return s.onBeforeRender=(...e)=>{d++,d%u===0&&c.apply(s,e)},l.push(s),r.add(s),s},p=f(a,n,768,`Live scene reflection · central lagoon`),m=[n[0]-87,n[1]+.8,n[2]+18],h=new c(12.7,64);t.geometries.add(h);let v=f(h,m,384,`Live scene reflection · arrival garden court`,2),y=Ye(.2),b=Ye(3.4);t.textures.add(y).add(b);let x=new _e({color:3904155,emissive:534573,emissiveIntensity:.08,roughness:.07,metalness:.04,transmission:.14,clearcoat:1,clearcoatRoughness:.06,normalMap:y,normalScale:new _(.12,.12),side:2,transparent:!0,opacity:.34,depthWrite:!1,depthTest:!0,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1});t.materials.add(x),y.wrapS=y.wrapT=b.wrapS=b.wrapT=Ae,y.repeat.set(2.8,1.7),b.repeat.set(4.2,2.5);let S=new G(a,x);S.name=`Animated lagoon surface normals and fresnel tint`,S.position.copy(p.position),S.rotation.copy(p.rotation),S.renderOrder=2,r.add(S);let C=x.clone();C.color.set(1400170),C.opacity=.32,t.materials.add(C);let w=new I({color:1466221,emissive:404020,emissiveIntensity:.18,roughness:.2,metalness:.12});t.materials.add(w);let T=new G(h,w);T.name=`Arrival court visible water depth`,T.position.set(m[0],m[1]-.055,m[2]),T.rotation.x=-Math.PI/2,T.renderOrder=0,r.add(T);let E=new G(h,C);E.name=`Animated arrival court normals and fresnel tint`,E.position.set(...m),E.rotation.x=-Math.PI/2,E.renderOrder=2,r.add(E);let D=new I({color:2379602,roughness:.98,metalness:.02});t.materials.add(D);let O=new G(a,D);O.name=`Lagoon recessed dark basin`,O.position.set(n[0],n[1]-.36,n[2]),O.rotation.copy(p.rotation),O.renderOrder=0,r.add(O);let k=new I({color:4811878,roughness:.76,metalness:.18});t.materials.add(k);let A=new G(new H(1,.055,8,128),k);t.geometries.add(A.geometry),A.name=`Lagoon carved stone shoreline`,A.position.set(n[0],n[1]+.04,n[2]),A.rotation.x=Math.PI/2,A.scale.set(112.7,68.6,1),A.castShadow=A.receiveShadow=!0,r.add(A);let j=new I({color:12054244,emissive:3969932,emissiveIntensity:.22,roughness:.24,transparent:!0,opacity:.42,depthWrite:!1});t.materials.add(j);let M=new G(new H(1,.018,6,128),j);t.geometries.add(M.geometry),M.name=`Lagoon thin foam waterline`,M.position.set(n[0],n[1]+.12,n[2]),M.rotation.x=Math.PI/2,M.scale.set(110.86,67.48,1),M.renderOrder=4,r.add(M);let ee=new I({color:10479324,emissive:3913389,emissiveIntensity:.8,roughness:.16,metalness:.12,transparent:!0,opacity:.58,depthWrite:!1});t.materials.add(ee);let N=[],F=[];for(let e=0;e<8;e++){let i=new G(new H(2.8+e%3*.55,.11,8,32),ee);t.geometries.add(i.geometry);let a=e/8*Math.PI*2;i.position.set(n[0]+Math.cos(a)*(30+e%2*28),n[1]+.13,n[2]+Math.sin(a)*(15+e%3*16)),i.rotation.x=Math.PI/2,i.userData.phase=e*.81,i.userData.baseScale=.7+e%3*.15,i.renderOrder=3,i.castShadow=!1,i.receiveShadow=!1,r.add(i),N.push(i)}for(let e=0;e<4;e++){let n=new G(new H(1.9+e%2*.55,.085,8,28),ee);t.geometries.add(n.geometry);let i=e/4*Math.PI*2+.3;n.position.set(m[0]+Math.cos(i)*(3.2+e%2*2.1),m[1]+.11,m[2]+Math.sin(i)*(2.4+e%2*1.8)),n.rotation.x=Math.PI/2,n.userData.phase=1.6+e*.71,n.userData.baseScale=.56+e%2*.12,n.renderOrder=3,n.castShadow=!1,n.receiveShadow=!1,r.add(n),F.push(n)}let ne=new I({color:5211236,roughness:.78,metalness:.03}),re=new I({color:16176804,emissive:9195320,emissiveIntensity:.22,roughness:.34});t.materials.add(ne).add(re);let ie=[];for(let e=0;e<7;e++){let i=e/7*Math.PI*2+.22,a=new G(new V(2+e%2*.36,2.15,.1,18,1,!1,.22,Math.PI*1.78),ne);if(t.geometries.add(a.geometry),a.position.set(n[0]+Math.cos(i)*(22+e%3*22),n[1]+.24,n[2]+Math.sin(i)*(13+e%2*18)),a.scale.set(1+e%2*.22,1,.72+e%3*.08),a.rotation.y=i+.7,a.userData.phase=e*.74,a.userData.baseY=a.position.y,a.renderOrder=3,r.add(a),ie.push(a),e%2==0){let n=new G(new d(.48,12,8),re);t.geometries.add(n.geometry),n.position.set(a.position.x,a.position.y+.48,a.position.z),n.scale.set(1.1,.5,1.1),n.userData.phase=e*.74+.4,n.userData.baseY=n.position.y,n.renderOrder=4,r.add(n),ie.push(n)}}let ae=new I({color:7109749,roughness:.86,metalness:.08}),oe=new _e({color:7592406,emissive:1531489,emissiveIntensity:.24,roughness:.12,metalness:.06,transmission:.18,transparent:!0,opacity:.58,side:2,depthWrite:!1});t.materials.add(ae).add(oe);let se=new P;se.name=`Lagoon floating garden fountain and lilies`,se.position.set(n[0]-6,n[1]+.22,n[2]+4),r.add(se);let ce=new G(new V(3.9,4.4,.7,24),ae);t.geometries.add(ce.geometry),ce.position.y=-.02,se.add(ce);let le=new G(new H(3.6,.22,8,32),oe);t.geometries.add(le.geometry),le.rotation.x=Math.PI/2,le.position.y=.42,se.add(le);let ue=[];for(let e=0;e<3;e++){let n=new G(new z(1.35,4.8,4,10),oe);t.geometries.add(n.geometry),n.position.set(Math.cos(e/3*Math.PI*2)*.85,2.7,Math.sin(e/3*Math.PI*2)*.85),n.rotation.y=e/3*Math.PI*2,n.userData.phase=e*.95,n.renderOrder=4,se.add(n),ue.push(n)}let de=new I({color:7832186,roughness:.94,metalness:.04});t.materials.add(de);for(let e=0;e<11;e++){let i=-Math.PI*.25+e/10*Math.PI*.5,a=new G(new g(1.35+e%3*.28,1),de);t.geometries.add(a.geometry),a.position.set(n[0]+230*.43*Math.cos(i),n[1]+.34,n[2]+Math.sin(i)*53.2),a.scale.set(1.2,.35,.85),a.castShadow=a.receiveShadow=!0,r.add(a)}return{update(e){r.visible&&(y.offset.set(e*.006,e*.002),b.offset.set(-e*.004,e*.005),l.forEach(t=>{(Array.isArray(t.material)?t.material:[t.material]).forEach(t=>{t instanceof s&&t.uniforms.time&&(t.uniforms.time.value=e)})}),N.forEach(t=>{let n=t.userData.phase,r=t.userData.baseScale,i=.86+Math.sin(e*1.3+n)*.2;t.scale.set(r*i,r*i,r*i),t.material=ee}),F.forEach(t=>{let n=t.userData.phase,r=t.userData.baseScale,i=.92+Math.sin(e*1.15+n)*.14;t.scale.set(r*i,r*i,r*i),t.material=ee}),ie.forEach(t=>{let n=t.userData.phase;t.position.y=t.userData.baseY+Math.sin(e*.9+n)*.045,t.rotation.z=Math.sin(e*.22+n)*.035}),ue.forEach(t=>{let n=t.userData.phase,r=.9+Math.sin(e*2+n)*.1;t.scale.set(.8+r*.18,r,1),t.rotation.z=Math.sin(e*1.3+n)*.04}))},setQuality(e,t){let n=e?t?512:768:256,r=e?t?256:384:128;p.getRenderTarget().setSize(n,n),v.getRenderTarget().setSize(r,r),x.opacity=e?t?.19:.24:.12,C.opacity=e?t?.24:.32:.18,u=e?t?7:6:8},setVisible(e){r.visible=e},dispose(){l.forEach(e=>e.dispose()),r.removeFromParent(),r.clear()}}}function un(e,t,n,i){let a=new P;a.name=`Floating City distant islands, audience and airships`,e.add(a);let o=e=>(t.add(e),e),s=e=>(n.add(e),e),c=q[0],u=q[2],f=s(new I({color:6387835,roughness:.94,metalness:.04})),p=s(new I({color:5405527,roughness:.88})),m=s(new I({color:10194034,roughness:.8,metalness:.13}));s(new W({color:16242833,transparent:!0,opacity:.8,toneMapped:!1}));let h=o(new g(1,1)),_=o(new y(1,1)),x=o(B(1,1,1,.12)),S=[[-560,265,-750,1.15],[380,190,-910,.72],[730,315,-430,.88],[-830,155,-260,.74],[-430,370,480,.66],[800,225,380,.82],[-120,430,-1150,.58],[1080,365,-1080,.6]],C=[];S.forEach(([e,t,n,r],i)=>{let o=new P;o.name=`Distant floating island ${i+1}`,o.position.set(c+e,K+t,u+n);let s=new G(h,f);s.scale.set(58*r,37*r,50*r),s.scale.y*=.86;let l=new G(_,p);l.position.y=31*r,l.scale.set(53*r,18*r,46*r),o.add(s,l);for(let e=0;e<3;e++){let t=new G(x,m);t.position.set((e-1)*15*r,42*r,(e%2?10:-7)*r),t.scale.set(7*r,(18+e*7)*r,7*r),o.add(t)}o.traverse(e=>{e instanceof G&&(e.castShadow=!1,e.receiveShadow=!1)}),o.userData.baseY=o.position.y,a.add(o),C.push(o)});let w=s(new I({color:5860455,roughness:.86})),D=o(B(76,2.2,9,.3));for(let[e,t]of[[-1,-150],[1,-150]])for(let n=0;n<6;n++){let r=new G(D,w);r.position.set(c+e*(220+n*4),K+n*3.15+1,u+t+n*8),r.rotation.y=e<0?Math.PI*.13:-Math.PI*.13,r.scale.set(1,1,1),r.castShadow=!1,r.receiveShadow=!1,a.add(r)}let O=s(new I({color:16777215,roughness:.7})),k=s(new I({color:16777215,roughness:.56})),A=o(new N(.15,.28,4,8)),j=o(new d(.16,10,8)),M=new v(A,O,288),ee=new v(j,k,288);M.name=`Instanced bouncing distant audience bodies`,ee.name=`Instanced bouncing distant audience heads`,M.castShadow=ee.castShadow=!1,M.receiveShadow=ee.receiveShadow=!1;let te=[],F=[16760171,7981233,13346799,8041957,15890573,15061363];for(let e=0;e<288;e++){let t=e<144?-1:1,n=e%144,r=Math.floor(n/24),i=n%24,a={x:c+t*(190+r*5)+(i-11.5)*2.9,y:K+r*3.15+3.1,z:u-150+r*8+i%2*.45,phase:e*.613,color:new T(F[e%F.length])};te.push(a),M.setColorAt(e,a.color),ee.setColorAt(e,new T(16769215).lerp(a.color,.16))}M.instanceColor.needsUpdate=!0,ee.instanceColor.needsUpdate=!0,a.add(M,ee);let ne=new L,re=new b,ie=new b(1,1,1),ae=new U,oe=(e,t)=>{for(let n=0;n<t;n++){let t=te[n],r=Math.max(0,Math.sin(e*2.5+t.phase))*.18;re.set(t.x,t.y+r,t.z),ae.setFromAxisAngle(new b(0,1,0),Math.sin(e*1.7+t.phase)*.16),ne.compose(re,ae,ie),M.setMatrixAt(n,ne),re.y+=.34,ne.compose(re,ae,ie),ee.setMatrixAt(n,ne)}M.instanceMatrix.needsUpdate=!0,ee.instanceMatrix.needsUpdate=!0},se=o(new d(1,16,10)),ce=o(B(1,1,1,.11)),ue=o(new r(1,1,4)),de=s(new I({color:5666690,roughness:.45,metalness:.54})),fe=s(new I({color:13872485,roughness:.35,metalness:.76})),R=[];for(let[e,t,n,r]of[[-900,300,-520,1.05],[520,395,-780,.72],[890,245,410,.83]]){let i=new P,o=new G(se,de);o.scale.set(18*r,8*r,8*r);let s=new G(ce,fe);s.position.set(0,-8*r,0),s.scale.set(7*r,2.2*r,3.2*r),i.add(o,s);for(let e of[-1,1]){let t=new G(ue,fe);t.position.set(-11*r,0,e*5*r),t.rotation.x=e*Math.PI*.5,t.scale.set(2.4*r,4*r,1),i.add(t)}i.traverse(e=>{e instanceof G&&(e.castShadow=e.receiveShadow=!1)}),a.add(i),R.push({root:i,center:new b(c+e,K+t,u+n),phase:e*.003})}let z=document.createElement(`canvas`);z.width=z.height=128;let pe=z.getContext(`2d`),me=pe.createRadialGradient(64,64,2,64,64,64);me.addColorStop(0,`rgba(212,242,238,.42)`),me.addColorStop(.52,`rgba(172,214,213,.18)`),me.addColorStop(1,`rgba(172,214,213,0)`),pe.fillStyle=me,pe.fillRect(0,0,128,128);let he=new je(z);he.colorSpace=le,i.add(he);let ge=s(new E({map:he,transparent:!0,depthWrite:!1,opacity:.72,toneMapped:!1})),_e=[];for(let[e,t,n,r,i]of[[-550,150,-450,680,240],[380,245,-700,740,250],[970,170,100,620,210],[-900,330,240,720,250]]){let o=new l(ge);o.position.set(c+e,K+t,u+n),o.scale.set(r,i,1),a.add(o),_e.push(o)}let V={islands:C.length,crowd:288,airships:R.length,hazeLayers:_e.length},H=288,ve=-1/0;return oe(0,H),{stats:V,update(e){e-ve>1/30&&(ve=e,oe(e,H)),C.forEach((t,n)=>{t.position.y=t.userData.baseY+Math.sin(e*.24+n)*.8}),R.forEach(({root:t,center:n,phase:r},i)=>{t.position.set(n.x+Math.sin(e*.08+r)*(85+i*18),n.y+Math.sin(e*.55+r)*3.4,n.z+Math.cos(e*.08+r)*24),t.rotation.y=Math.sin(e*.08+r)*.2-.2}),_e.forEach((t,n)=>{t.material.opacity=.54+Math.sin(e*.21+n)*.1})},setQuality(e,t){H=e?t?176:288:96,M.count=ee.count=H,V.crowd=H,oe(0,H)}}}function dn(e,t,r){e.updateMatrixWorld(!0);let i=[];e.traverse(e=>{if(!(e instanceof G)||e instanceof v||Array.isArray(e.material)||e.material.transparent||!(e.material instanceof I||e.material instanceof _e))return;let t=e.geometry.getAttribute(`position`);if(!t||t.count<16||t.count>96||(e.geometry.computeBoundingBox(),!e.geometry.boundingBox))return;let n=e.geometry.boundingBox.clone().applyMatrix4(e.matrixWorld);n.getSize(new b).length()<.3||i.push({mesh:e,material:e.material,box:n})}),i.sort((e,t)=>e.box.getCenter(new b).lengthSq()-t.box.getCenter(new b).lengthSq());let a=i.slice(0,16),o=a.slice(0,10),s=new oe,c=new b,l=new b,u=new b,d=new b,f=new b,p=new b,m=new b,h=new n,g=0;for(let[e,n]of o.entries()){let i=n.mesh.geometry,o=i.getAttribute(`position`),_=i.getAttribute(`normal`);if(!o||!_)continue;let v=i.clone(),y=new Float32Array(o.count*3),b=i.getAttribute(`color`);h.getNormalMatrix(n.mesh.matrixWorld);for(let t=0;t<o.count;t++){c.fromBufferAttribute(o,t).applyMatrix4(n.mesh.matrixWorld),u.fromBufferAttribute(_,t).applyMatrix3(h).normalize(),d.set(0,1,0).cross(u),d.lengthSq()<.02&&d.set(1,0,0).cross(u),d.normalize(),f.crossVectors(u,d).normalize();let r=0;for(let n=0;n<5;n++){let i=n/5*Math.PI*2+t*.618;p.copy(u).multiplyScalar(.62).addScaledVector(d,Math.cos(i)*.56).addScaledVector(f,Math.sin(i)*.56).normalize(),l.copy(c).addScaledVector(u,.035),s.set(l,p);let o=1/0;for(let t=0;t<a.length;t++){if(t===e)continue;let n=a[t];if(!s.intersectBox(n.box,m))continue;let r=m.distanceTo(s.origin);r>.035&&r<o&&(o=r)}o<4.5&&(r+=1-o/4.5)}let i=1-r/5*.36,g=b?b.getX(t):1,v=b?b.getY(t):1,x=b?b.getZ(t):1;y[t*3]=g*i,y[t*3+1]=v*i,y[t*3+2]=x*i}v.setAttribute(`color`,new M(y,3)),v.computeBoundingSphere();let x=n.material.clone();x.vertexColors=!0,x.needsUpdate=!0,t.add(v),r.add(x),n.mesh.geometry=v,n.mesh.material=x,n.mesh.userData.floatingVertexAO=!0,g+=o.count}let _={meshes:o.length,vertices:g,hemisphereSamples:5};return e.userData.floatingVertexAO=_,_}var fn=Math.PI*2;function pn(e,t){let n=Math.sin(e*12.9898+t*78.233)*43758.5453;return n-Math.floor(n)}function mn(e,t,n,r,i=new U){e.setMatrixAt(t,new L().compose(n,i,r))}function hn(e,t){return e.add(t),t}function gn(e,t,n,r,i,a,o,s,c){let l=de(i,a,o,768,192);r.add(l);let u=new W({map:l,transparent:!0,depthWrite:!1,toneMapped:!1});n.add(u);let d=new G(new z(...c),u);return t.add(d.geometry),d.position.set(...s),d.name=`Floating world sign · ${i}`,e.add(d),d}function _n(e){return e===`jungle`?8306024:e===`water`?5682884:e===`volcanic`?12808021:e===`mechanical`?12097118:e===`castle`?13218685:11113840}function vn(e,t){return e.add(t),t}function $(e,t,n,r,i,a,o){t.add(n);let s=R(e,n,r,i,a);return o&&s.rotation.set(...o),s}function yn(e,t,n){(e.userData.dynamics??=[]).push({mesh:t,rate:n})}function bn(e,t,n,r,i,a,o,s,c){let l=new P;l.name=`Central park visitor amenities and garden court`,e.add(l);let u=q[0],f=q[2],p=vn(n,s.clone());p.color.set(7228722),p.roughness=.82;let m=vn(n,new I({color:3824470,roughness:.38,metalness:.76})),h=vn(n,new I({color:13871706,emissive:7225883,emissiveIntensity:.24,roughness:.34,metalness:.62})),_=vn(n,new I({color:16764792,emissive:16749117,emissiveIntensity:2.2,roughness:.22,metalness:.15})),v=vn(n,new I({color:10849643,roughness:.82,metalness:.08})),b=vn(n,i.clone());b.color.set(12166780),b.roughness=.88;let x=vn(n,a.clone());x.color.set(4811618),x.roughness=.62,x.metalness=.42;let S=vn(n,new I({color:9360848,emissive:1731947,emissiveIntensity:.58,roughness:.16,metalness:.28,transparent:!0,opacity:.68})),C=vn(n,new I({color:1457472,emissive:1932402,emissiveIntensity:.34,roughness:.38,metalness:.2})),w=vn(n,new I({color:15251563,emissive:16751679,emissiveIntensity:1.5,roughness:.26,metalness:.12})),T=vn(n,new I({color:2972504,roughness:.28,metalness:.78})),E=(e,n,r,i,a)=>$(l,t,e,n,r,i,a);[0,Math.PI*.5,Math.PI,Math.PI*1.5,Math.PI*.25,Math.PI*.75,Math.PI*1.25,Math.PI*1.75].forEach((e,t)=>{let n=t>=4,r=n?6.2:9.6,i=n?96:124,a=i*.5,o=Math.sin(e),s=Math.cos(e),c=Math.cos(e),l=-Math.sin(e);E(B(r,.1,i,.1),b,[u+o*a,K+.18,f+s*a],void 0,[0,e,0]);for(let t of[-1,1])E(B(.16,.08,i-2.5,.04),x,[u+o*a+c*(r*.5-.44)*t,K+.27,f+s*a+l*(r*.5-.44)*t],void 0,[0,e,0])}),E(new V(25.5,25.5,.12,64),b,[u,K+.12,f]);for(let e of[12,20,25.2])E(new H(e,e===25.2?.34:.18,8,96),e===20?h:x,[u,K+.25,f],void 0,[Math.PI/2,0,0]);for(let e=0;e<4;e++){let t=e*Math.PI*.5+Math.PI*.25,n=Math.cos(t),r=Math.sin(t),a=-r,o=n,s=u+n*78,l=f+r*78,g=t+Math.PI/2;E(new V(5.9,6.5,.28,24),v,[s,K+.22,l]);for(let e of[-1,1]){let t=s+a*e*4.4,n=l+o*e*4.4;E(B(.62,5.8,.62,.1),p,[t,K+3.1,n]),E(new Te(.62,1),h,[t,K+6.05,n],[1.15,.42,1.15])}E(B(10.8,.58,7.4,.16),p,[s,K+6.18,l],void 0,[0,g,0]),E(B(9,.22,5.7,.06),h,[s,K+6.5,l],void 0,[0,g,0]),E(B(6.8,.42,.68,.1),i,[s-n*1.7,K+1.05,l-r*1.7],void 0,[0,g,0]),E(new V(.34,.42,2.8,12),m,[s+n*2.6,K+1.55,l+r*2.6]),E(new d(.42,14,10),_,[s+n*2.6,K+3.15,l+r*2.6]);for(let e of[-1,1]){let t=s+a*e*5.1-n*.8,u=l+o*e*5.1-r*.8;E(new V(.82,1.08,.9,12),i,[t,K+.68,u]),E(new y(1.35,2),c,[t,K+2.05,u],[1.18,.78,1.18])}}let D=u-42,O=f-42;E(new V(8.2,9.2,.42,32),i,[D,K+.42,O]),E(new V(6.8,7.2,.18,32),m,[D,K+.72,O]);for(let e of[-1,1])E(B(.48,4.5,.48,.08),p,[D+e*5.6,K+2.8,O]),E(B(.48,4.5,.48,.08),p,[D,K+2.8,O+e*5.6]);E(B(12.8,.45,12.8,.24),p,[D,K+5.2,O],void 0,[0,Math.PI*.25,0]),E(new Te(1.1,1),_,[D,K+3.8,O],[1.4,.58,1.4]),gn(l,t,n,r,`園區總覽 · 入口導覽`,`#fff5d2`,`#315a52`,[D,K+6.25,O-6.5],[8.8,1.3]);let k=f-35,A=k-6;for(let e of[-17,17])E(B(11.8,4.4,1.2,.16),a,[u+e,K+2.45,A]);E(B(20.8,3.9,.18,.04),S,[u,K+2.78,A+.66]),E(B(18.4,3.05,.4,.06),C,[u,K+2.88,A-1.12]);for(let e of[-6.8,-2.3,2.3,6.8])E(B(2.5,1.18,.08,.02),w,[u+e,K+3.18,A-.9]),E(B(2.1,.1,.1,.02),T,[u+e,K+2.56,A-.82]);E(new V(2.15,2.15,.14,32),T,[u,K+4,A-.84],void 0,[Math.PI/2,0,0]),E(new V(1.72,1.72,.16,32),w,[u,K+4,A-.72],void 0,[Math.PI/2,0,0]),E(B(12,.6,2,.08),p,[u,K+1.52,A+.16]),E(B(10.6,.12,.18,.02),w,[u,K+1.88,A+.66]),E(B(7.8,1.85,.12,.02),S,[u,K+4,A+1.06]);for(let e of[-9.4,-4.7,0,4.7,9.4])E(B(.16,3.75,.28,.03),T,[u+e,K+2.82,A+.78]);for(let e of[-7,0,7])E(new V(.3,.38,1.7,12),T,[u+e,K+4.42,A-.9]),E(new d(.43,14,10),w,[u+e,K+3.58,A-.9]);E(B(50,.5,7.4,.16),p,[u,K+5,A+1.1]),E(B(46.5,.16,7,.06),h,[u,K+5.32,A+1.1]);for(let e of[-19,-11.5,11.5,19])E(B(.72,4.5,.72,.08),i,[u+e,K+2.55,A+.7]),E(new d(.4,14,10),_,[u+e,K+5,A+.55]);for(let e of[-15.5,-7.5,7.5,15.5])E(B(5,2.05,.14,.04),S,[u+e,K+2.85,A+.7]),E(B(5.2,.12,.22,.03),h,[u+e,K+3.95,A+.58]);for(let e of[-17,17])E(B(11.5,2.65,4.2,.14),a,[u+e,K+6.28,A]),E(B(9.2,1.75,.16,.04),S,[u+e,K+6.38,A-2.16]),E(B(10,.16,4.55,.05),h,[u+e,K+7.68,A]);E(B(15.2,2.05,.16,.04),S,[u,K+6.45,A-2.08]);for(let e of[-12,-6,0,6,12])E(B(.18,2.55,.28,.03),T,[u+e,K+6.25,A-2.18]),E(B(2.1,.1,.18,.02),w,[u+e,K+6.12,A-2.3]);E(B(41,.48,5.7,.12),p,[u,K+7.88,A+.06]),E(B(43.5,.16,6,.05),h,[u,K+8.18,A+.06]);for(let e of[-1,1])E(B(20.5,.28,.46,.05),T,[u+e*8.1,K+8.46,A+.12],void 0,[0,0,e*.18]);E(B(7.2,3.1,.18,.04),x,[u,K+2.4,A+.9]),E(B(8.2,.22,.26,.04),h,[u,K+4,A+.86]);for(let e=0;e<4;e++){let t=e*Math.PI*.5+Math.PI*.25,n=u+Math.sin(t)*42,r=f+Math.cos(t)*42;E(B(6.6,.42,1,.08),p,[n,K+1.35,r],void 0,[0,t,0]);for(let e of[-1,1])E(B(.42,1,.42,.06),a,[n+Math.cos(t)*e*2.3,K+.72,r-Math.sin(t)*e*2.3]);E(new V(.22,.3,3,12),m,[n+Math.cos(t)*4.3,K+1.65,r-Math.sin(t)*4.3]),E(new d(.38,14,10),_,[n+Math.cos(t)*4.3,K+3.35,r-Math.sin(t)*4.3])}for(let e of[-1,1])E(B(1.1,7,1.1,.16),i,[u+e*15.5,K+3.7,k]),E(new Te(.78,1),h,[u+e*15.5,K+7.5,k],[1.2,.48,1.2]),E(new d(.46,14,10),_,[u+e*15.5,K+6.25,k-.65]);E(B(33,.75,1.2,.14),i,[u,K+6.45,k]),E(B(30,.18,1.42,.05),h,[u,K+6.92,k]);let j=u+28,M=f-22;E(new V(13.5,15.2,.36,48),i,[j,K+.3,M]),E(new H(12.7,.34,8,64),h,[j,K+.52,M],void 0,[Math.PI/2,0,0]),E(new V(1.35,1.7,2.8,18),a,[j,K+1.95,M]),E(new Te(1.25,1),_,[j,K+3.85,M],[1.4,.66,1.4]);for(let e=0;e<4;e++){let t=Math.PI*.25+e*Math.PI*.5,n=j+Math.cos(t)*11.8,r=M+Math.sin(t)*11.8;E(new V(.55,.72,.72,12),i,[n,K+.72,r]),E(new y(.82,1),c,[n,K+1.7,r],[1.15,.7,1.15])}for(let e of[-1,1]){let t=u+e*34,n=f-18;E(B(14.5,.36,6.2,.16),i,[t,K+.3,n],void 0,[0,e*.12,0]),E(B(12.8,.22,4.7,.08),x,[t,K+.58,n],void 0,[0,e*.12,0]);for(let e of[-4.4,0,4.4])E(new V(.66,.82,.76,14),i,[t+e,K+.9,n]),E(new y(1.55,2),c,[t+e,K+2.45,n],[1.15,.92,1.15]);E(B(8,.42,.96,.08),p,[t,K+1.35,n+4.4],void 0,[0,e*.12,0]),E(new V(.22,.3,2.9,12),m,[t+e*6.5,K+1.65,n-1.4]),E(new d(.42,14,10),_,[t+e*6.5,K+3.35,n-1.4])}for(let e of[-1,1]){let t=u+e*43,n=f-10;E(B(26,.18,11,.1),i,[t,K+.42,n],void 0,[0,e*.08,0]),E(B(23.5,.28,8.5,.12),o,[t,K+.66,n],void 0,[0,e*.08,0]);for(let e of[-7.4,0,7.4])E(new V(.62,.84,.72,12),i,[t+e,K+1.14,n]),E(new y(1.45,2),c,[t+e,K+2.45,n],[1.16,.82,1.16])}for(let e of[-1,1]){let t=u+e*70,n=f-42;E(B(34,.24,19,.12),o,[t,K+.37,n],void 0,[0,e*.08,0]),E(B(36.5,.18,21.5,.08),i,[t,K+.16,n],void 0,[0,e*.08,0]);for(let e of[-11,0,11])E(new V(.78,1.05,.82,14),i,[t+e,K+.85,n]),E(new y(1.7,2),c,[t+e,K+2.35,n],[1.2,.9,1.2]);for(let r of[-6.8,6.8])E(new g(1.15,1),i,[t+e*12.6,K+1.1,n+r],[1.35,1.1,.9],[.1,e*.22,.05]),E(new V(.2,.28,2.7,10),m,[t-e*12.6,K+1.55,n+r]),E(new d(.42,14,10),_,[t-e*12.6,K+3.2,n+r])}return l}function xn(e,t,n,i,a,o,s){let c=new P;c.name=`Floating attraction theme set · ${a.publicName}`,c.position.set(a.entry[0],a.isCastle?a.entry[1]:K,a.entry[2]),e.add(c),cn(c,{geometries:t,materials:n,textures:i},a,s);let l=vn(n,new I({color:a.color,emissive:a.color,emissiveIntensity:.14,roughness:.46,metalness:.22})),u=B(4.5,.32,7.5,.12);for(let e of[-1,1]){$(c,t,u,o.stone,[e*11,.18,1.2]);let n=$(c,t,new V(.34,.48,5.2,10),o.stone,[e*11,2.75,.2]),r=$(c,t,new Te(.72,1),l,[e*11,5.7,.2],[1,1.25,1]);yn(c,r,e*.28),n.castShadow=r.castShadow=!0}let f=c.children.length,p=(e,n,r,i)=>$(c,t,e,o.stone,n,r,i),m=(e,n,r,i)=>$(c,t,e,l,n,r,i);switch(a.pattern){case`gate`:for(let e of[-1,1])p(B(2.4,8,2.4,.16),[e*5.5,4,-1]),m(new H(3.7,.32,10,28,Math.PI),[0,6.9,-1],[1,1,1],[0,0,0]);break;case`waterfall`:{let e=$(c,t,new z(8,13,10,18),o.water,[-10.5,6.5,-1],[1,1,1],[0,0,Math.PI/2]);e.rotation.set(0,Math.PI,0),yn(c,e,.34),$(c,t,new V(5.8,6.3,.28,32),o.water,[-10.5,.3,-1]),m(new H(5.9,.22,8,32),[-10.5,.48,-1]);break}case`boulder`:for(let[e,t,n,r]of[[-11,2.1,-1,2.1],[11,2.8,2,2.7],[-10,1.5,3,1.7]])p(new g(1,1),[e,t,n],[r,r*.86,r],[.14,.4,.22]);break;case`bridge`:for(let e of[-1,1]){p(new V(.36,.5,7,10),[e*11,3.5,-1]);let t=m(new V(.1,.1,13,8),[e*11,5.8,-1],[1,1,1],[Math.PI/2,0,0]);t.rotation.z=Math.PI/2}m(new H(4,.16,8,28),[0,3.6,-1],[1,1,1],[Math.PI/2,0,0]);break;case`temple`:yn(c,m(new V(3.3,3.3,.45,32),[0,5.6,-1],[1,1,1],[Math.PI/2,0,0]),.22);for(let e of[-1,1])p(new V(.7,.95,6,14),[e*5,3,-1]);break;case`vine`:for(let e of[-1,1])yn(c,m(new H(3.6,.22,10,32),[e*8,4.2,-1],[1,1,1],[Math.PI/2,0,0]),e*.32),p(new V(.5,.85,8,10),[e*8,4,-1]);break;case`water`:for(let e of[-1,1])yn(c,$(c,t,B(8,.18,7,.08),o.water,[e*8,.18,-1]),.18),m(new H(3.2,.18,8,24),[e*8,.38,-1]);break;case`maze`:for(let e of[-1,1])p(B(4,4.6,1.2,.12),[e*9,2.3,-2]),p(B(2.5,3.1,1.2,.12),[e*4.5,1.55,2.5]);m(new Te(1,1),[0,5.8,-1],[1.6,1.6,1.6]);break;case`volcano`:for(let e of[-1,1]){p(new r(2.5,6.5,8),[e*8.5,3.25,-1]);let t=m(new V(1.3,1.3,.12,20),[e*8.5,6.55,-1]);t.material=vn(n,new I({color:16742973,emissive:16727074,emissiveIntensity:2.3})),yn(c,t,e*.45)}break;case`statue`:for(let e of[-1,1])p(B(2.8,6,2.4,.15),[e*8,3,-1]),m(new d(1.15,18,12),[e*8,7,-1]),m(new r(.7,2.3,6),[e*8,8.3,-1],[1,1,1],[0,0,Math.PI]);break;case`mine`:for(let e of[-1,1]){let t=m(new V(.12,.12,14,8),[e*2.2,.55,-1],[1,1,1],[Math.PI/2,0,0]);t.rotation.x=Math.PI/2}p(B(4.2,1.8,3.4,.16),[0,1.45,-1]),m(new H(1.7,.18,8,24),[0,1.6,-2.75],[1,1,1],[Math.PI/2,0,0]);break;case`tree`:p(new V(1.8,2.8,9,12),[0,4.5,-1]),m(new y(4.8,1),[0,10,-1],[1.2,1.05,1.2]);for(let e of[-1,1])m(new d(1.6,16,10),[e*4.2,7.2,-1]);break;case`observatory`:yn(c,m(new H(4.2,.32,10,36),[0,5.7,-1]),.38),p(new V(.85,1.1,8,14),[0,4,-1]),m(new d(1.8,24,16),[0,5.7,-1],[1.8,.65,1.8]);break;case`cave`:p(new d(5.6,18,12),[0,4.3,-1],[1.25,.92,.78]),yn(c,$(c,t,new V(2.5,2.8,.28,24),o.dark,[0,2.2,-5.35],[1,1,1],[Math.PI/2,0,0]),.16);break;case`canal`:$(c,t,B(12,.18,7,.08),o.water,[0,.2,-1]);for(let e of[-1,1])p(B(2,3.8,8,.14),[e*7,1.9,-1]);m(new H(3.2,.2,8,28),[0,.42,-1]);break;case`beast`:p(B(5,4.5,4,.16),[0,3,-1]),m(new d(2.5,20,14),[0,6.3,-1],[1.15,.9,1]);for(let e of[-1,1])m(new r(.65,3.2,8),[e*2.1,8,-1],[1,1,1],[0,0,e*.28]);break;case`harbor`:p(B(12,.45,5,.12),[0,.35,-1]);for(let e of[-1,1]){let t=m(new V(.18,.24,10,8),[e*5,5,-1]),n=m(new z(4,5),[e*5,5.1,-1.1]);n.rotation.y=e*.22,yn(c,t,e*.2)}break;case`construction`:for(let e of[-1,1])p(B(1.2,10,1.2,.12),[e*7,5,-1]);m(B(17,.9,.9,.12),[0,9.5,-1]),yn(c,m(new V(.16,.16,4,8),[3,7.4,-1]),.42);break;case`finale`:m(new H(5.5,.38,12,40),[0,6.5,-1]),m(new y(1.3,1),[-7,5.5,-1]),m(new y(1.3,1),[7,5.5,-1]);for(let e of[-1,1])yn(c,m(new z(2.2,4.5,2,3),[e*8,5.5,-1]),e*.3);break;case`castle`:p(B(7,8,5,.16),[0,4,-1]),m(new r(3.5,7,8),[0,11.5,-1])}let h=new P;h.name=`Playable mechanism preview court · ${a.publicName}`,h.position.set(a.id.length%2?25:-25,0,.5);for(let e of c.children.slice(f))e.removeFromParent(),h.add(e);return c.add(h),c.userData.attractionId=a.id,c}function Sn(e,t,n,r,i,a,o){let s=q[0],c=q[2],l=new P;l.name=`Central park wayfinding ring`,e.add(l);for(let e=0;e<i.length;e++){let u=i[e],d=e/i.length*fn-Math.PI/2,f=s+Math.cos(d)*102,p=c+Math.sin(d)*102,m=$(l,t,new V(.24,.34,4.8,8),o,[f,K+2.4,p]);m.castShadow=!0;let h=$(l,t,new Te(.9,1),a,[f,K+5.25,p]);h.material=vn(n,new I({color:u.color,emissive:u.color,emissiveIntensity:.42,roughness:.34,metalness:.32})),gn(l,t,n,r,u.publicName,`#fff8df`,`#${_n(u.zone).toString(16).padStart(6,`0`)}`,[f,K+8.1,p],[8.5,1.35]).lookAt(s,K+8.1,c)}let u=$(l,t,new V(.75,1.05,.16,64),a,[s,K+.34,c]);u.name=`Central park compass inlay`,u.receiveShadow=!0;for(let e of[0,Math.PI/2,Math.PI,Math.PI*3/2]){let n=$(l,t,B(.14,.1,1.6,.035),a,[s,K+.47,c],[1,1,1],[0,e,0]);n.name=`Central park compass spoke`,n.receiveShadow=!0}return gn(l,t,n,r,`20 座設施總覽 · M 快捷傳送`,`#fff6d8`,`#2d514b`,[s,K+13.2,c-20],[18,2.9]),gn(l,t,n,r,`遠眺浮游城 ↖`,`#fff6d8`,`#705437`,[s-55,K+5.6,c-55],[10,1.8]),l}function Cn(e,t,n){let i=q[0],a=q[2],o=new _(-1,-1).normalize(),s=Math.atan2(o.x,o.y),c=new P;c.name=`Floating City distant lookout`,c.position.set(i+o.x*68,K,a+o.y*68),c.rotation.y=s,e.add(c);let l=vn(n,new I({color:13941100,emissive:9198634,emissiveIntensity:.34,roughness:.38,metalness:.66})),u=vn(n,new I({color:9404523,roughness:.92}));$(c,t,new V(18,22,.5,40),u,[0,.42,0]);let f=$(c,t,new H(18,1.1,12,56),l,[0,12,0]);f.castShadow=!0;for(let e of[-1,1])$(c,t,new V(1.15,1.65,12,12),u,[e*17,6,0]);let p=new P;p.name=`Distant Floating City silhouette`,p.position.set(i-780,K+150,a-760),e.add(p);let m=vn(n,new I({color:9282976,emissive:2575440,emissiveIntensity:.72,roughness:.56,metalness:.32,transparent:!0,opacity:.95})),h=vn(n,new W({color:15780728,transparent:!0,opacity:.82,toneMapped:!1})),g=$(p,t,new V(34,42,8,10),m,[0,0,0]);g.castShadow=!1;for(let[e,n,i,a]of[[-22,-13,42,7],[0,-4,64,10],[22,-14,48,8],[-10,18,34,6],[14,17,38,6]])$(p,t,new V(a*.72,a,i,8),m,[e,i/2+3,n]),$(p,t,new r(a*1.15,i*.26,8),m,[e,i+8,n]),$(p,t,new d(1.1,12,8),h,[e,i*.62,n-a*.78]);let v=$(p,t,new H(42,1.1,10,48),h,[0,12,0]);return v.rotation.x=Math.PI/2,c}function wn(e,t,n,i,a){let o=new P;o.name=`Floating park distant attraction skyline`,e.add(o);let s=new Map,c=new Map,l=vn(n,new W({color:16767115,transparent:!0,opacity:.78,toneMapped:!1})),u=vn(n,new I({color:1387569,roughness:.58,metalness:.24})),f=e=>{let t=s.get(e.id);if(t)return t;let r=e.zone===`jungle`?a.bark:e.zone===`volcanic`||e.zone===`mechanical`?a.rock:a.limestone,i=new T(_n(e.zone));i.offsetHSL((e.color%17-8)/360,(e.color%11-5)/100,(e.color%13-6)/100);let o=vn(n,new I({color:i,map:r.map,normalMap:r.normalMap,roughnessMap:r.roughnessMap,normalScale:new _(e.zone===`jungle`?.42:.28,e.zone===`jungle`?.42:.28),roughness:.78,metalness:e.zone===`mechanical`?.58:.12}));return s.set(e.id,o),o},p=e=>{let t=c.get(e.id);if(t)return t;let r=e.zone===`jungle`?a.bark:e.zone===`volcanic`||e.zone===`mechanical`?a.rock:a.limestone,i=new T(e.zone===`jungle`?3563335:e.zone===`water`?2913399:e.zone===`volcanic`?4796984:e.zone===`mechanical`?4676180:6968891);i.offsetHSL((e.color%19-9)/360,.02,0);let o=vn(n,new I({color:i,map:r.map,normalMap:r.normalMap,roughnessMap:r.roughnessMap,normalScale:new _(.2,.2),roughness:.86,metalness:e.zone===`mechanical`?.62:.18}));return o.emissive.set(_n(e.zone)),o.emissiveIntensity=.12,c.set(e.id,o),o},m=(e,n,r,i,a,o)=>{let s=$(e,t,n,r,i,a,o);return s.castShadow=!1,s.receiveShadow=!0,s},h=(e,t,n,i)=>{let a=(t,r)=>m(e,B(1,1,1,.12),n,t,r),o=(t,n)=>m(e,new r(1,1,6),i,t,n,[0,Math.PI/6,0]);switch(t.pattern){case`gate`:case`finale`:a([0,11.8,-1.5],[7.2,13.2,5.8]);for(let e of[-3.2,3.2])o([e,19.5,-1.5],[1.8,3.2,1.8]);break;case`temple`:a([0,16.4,0],[23,1.7,9.5]),a([0,18.1,0],[16.5,1.45,7]),m(e,new V(2.2,2.2,.55,20),l,[0,19.45,-4.8],[1.3,1,1.3],[Math.PI/2,0,0]);break;case`maze`:for(let e of[-8.5,8.5]){a([e,10.2,-7],[6,10,1.5]);for(let t of[-2,0,2])o([e+t,16,-7],[.8,2,.8])}a([0,8.8,6],[16,7.2,1.2]);break;case`statue`:case`beast`:for(let t of[-6.2,6.2])m(e,new g(2.7,1),n,[t,14.7,-1],[1.15,1.8,1]),o([t,18.3,-1],[1.25,2.4,1.25]);if(t.pattern===`beast`)for(let t of[-2,2])m(e,new r(.7,3.8,8),i,[t,17,-6.1],[1,1,1],[0,0,t<0?-.18:.18]);break;case`bridge`:a([0,17,0],[23,1.2,3]);for(let e of[-9.5,9.5])a([e,11.4,0],[1.7,11.5,1.7]),o([e,18.3,0],[1.7,2.7,1.7]);break;case`vine`:m(e,new V(2,2.8,17,12),n,[0,11.8,0]);for(let t of[9,13,17]){let n=m(e,new H(4.2,.32,8,28),i,[0,t,0]);n.rotation.x=Math.PI/2}break;case`tree`:m(e,new V(3.6,5,18,14),n,[0,11.5,0]),m(e,new d(7.8,16,10),i,[0,22,0],[1.35,.9,1.2]);break;case`waterfall`:for(let e of[-7,7])a([e,10.5,0],[4.2,12,5.4]);m(e,B(5.8,15,.28,.06),l,[0,9,-8.8]),a([0,2,-4.8],[22,1.2,7]);break;case`water`:case`canal`:a([0,12.2,0],[24,1.3,5.8]);for(let t of[-8.5,8.5])m(e,new H(3,.65,10,28,Math.PI),i,[t,8.7,-5.2],[1,1.1,1],[Math.PI/2,0,0]);m(e,B(16,.35,3.2,.04),l,[0,8,-5.4]);break;case`harbor`:a([0,1.2,-4.4],[27,1.5,7.2]);for(let t of[-8.5,8.5])m(e,new V(.42,.65,16,10),i,[t,9,-2]),m(e,new r(1,1,4),l,[t,10.5,-5],[4.2,6.2,.4],[0,0,t<0?-.08:.08]);break;case`volcano`:m(e,new r(1,1,10),n,[0,12.5,0],[10,18,10]),m(e,new V(2.2,2.2,.5,20),l,[0,21.6,0]);let s=m(e,new H(7.3,.34,8,32),l,[0,9.8,0]);s.rotation.x=Math.PI/2;break;case`mine`:for(let e of[-9,9])a([e,10.5,0],[1.1,12.8,1.1]);a([0,16,0],[20,1,1]),m(e,B(7,2.6,3.8,.12),i,[0,2.5,-5.2],[1,1,1],[0,.12,0]);break;case`observatory`:{m(e,new V(6,6.4,8.5,24),n,[0,7.6,0]),m(e,new d(5.9,20,12,0,fn,0,Math.PI/2),i,[0,12,0],[1,.8,1]);let t=m(e,B(.7,.7,11,.12),l,[0,16,-1.5],[1,1,1],[.28,0,-.26]);t.rotation.z=-.24;break}case`cave`:case`boulder`:for(let[t,r,i]of[[-8,11,1.2],[0,14,1.55],[8,10.2,1.3]])m(e,new g(4.1,1),n,[t,r,0],[i,i*1.18,i*.92]);t.pattern===`cave`&&m(e,B(8,4.5,.38,.12),l,[0,6,-8.4]);break;case`construction`:for(let e of[-9.5,9.5])a([e,11,0],[1.2,15,1.2]);a([0,18,0],[22,1,1]),m(e,new V(.24,.24,7.5,8),l,[3.6,11,-3]),m(e,B(5.5,.45,.45,.04),l,[0,14.7,-3],void 0,[0,0,.05])}},v=(e,t,n,i)=>{let a=B(1,1,1,.08),o=B(1,1,.12,.04),s=B(1,1,1,.06),c=B(1,1,1,.08),d=(t,n,r,i,a)=>m(e,t,n,r,i,a);for(let e of[2.25,4.45,6.65])for(let[t,r]of[[-13,6.2],[-6.2,4.2],[6.2,4.2],[13,6.2]])d(a,n,[t,e,9.15],[r,.07,.18]);d(c,i,[0,8.35,9],[27,.28,.42]),d(s,u,[0,4,9.18],[7.2,5.6,.12]),d(s,i,[-4.5,4.35,9.3],[.34,5.9,.3]),d(s,i,[4.5,4.35,9.3],[.34,5.9,.3]);for(let e of[-11.2,-7.2,7.2,11.2])d(o,l,[e,4.35,9.27],[2.7,1.85,1]),d(s,i,[e,3.35,9.34],[3,.12,.18]),d(s,i,[e,5.35,9.34],[3,.12,.18]);switch(t.pattern){case`gate`:case`finale`:for(let e of[-1,1])d(new V(.48,.58,7.2,10),i,[e*6,4.6,9.5],[1,1,1]),d(new r(.8,1.8,6),i,[e*6,9.2,9.5],[1,1,1]);break;case`temple`:for(let e of[-10,-5,5,10])d(new V(.32,.42,6.2,10),i,[e,4.8,9.55],[1,1,1]);d(new V(1.35,1.35,.18,20),l,[0,7.9,9.44],[1.4,1,1.4],[Math.PI/2,0,0]);break;case`bridge`:case`vine`:case`tree`:for(let e of[-1,1])d(s,i,[e*8.8,4.6,9.42],[.28,6.9,.28]),d(s,i,[e*4.4,7.5,9.42],[4.9,.24,.24],[0,0,e*.16]);break;case`waterfall`:d(B(4.3,5.6,.18,.05),l,[0,4.8,9.46],[1,1,1]);for(let e of[-1,1])d(s,n,[e*8.3,4.8,9.44],[.6,7.8,.6]);break;case`water`:case`canal`:case`harbor`:if(d(B(15.5,.22,.28,.04),l,[0,2.2,9.48],[1,1,1]),t.pattern===`harbor`)for(let e of[-1,1])d(new V(.18,.24,8.6,8),i,[e*8.7,5.1,9.3],[1,1,1]);break;case`volcano`:for(let e of[-1,1])d(B(.16,2.4,.1,.02),l,[e*5,4.8,9.46],[1,1,1],[0,0,e*.16]);break;case`mine`:case`construction`:for(let e of[-1,1])d(s,i,[e*7.7,5,9.45],[.3,8.2,.3]);d(s,i,[0,8.55,9.45],[16,.3,.3]);break;case`observatory`:{let e=d(new H(3.4,.24,8,28),i,[0,6.8,9.5],[1,.72,1]);e.rotation.x=Math.PI/2;break}case`cave`:case`boulder`:{let e=d(new H(3.8,.62,10,28,Math.PI),n,[0,5.4,9.42],[1.35,1.1,1]);e.rotation.y=Math.PI;break}}},y=i.filter(e=>!e.isCastle),b=q[0],x=q[2];return y.forEach((e,n)=>{let i=new P;i.name=`Distant park landmark · ${e.publicName}`;let a=-Math.PI*.5+n/y.length*fn,s=230+n%3*28,c=b+Math.cos(a)*s,u=x+Math.sin(a)*s;i.position.set(c,K,u),i.rotation.y=Math.atan2(b-c,x-u);let d=f(e),g=p(e),_=(e,n,r,a,o)=>{let s=$(i,t,e,n,r,a,o);return s.userData.skylineShadowCaster=!0,s};_(B(34,10,21,.32),d,[0,5,0]);for(let e of[-1,1])_(B(5.2,16,5.2,.18),d,[e*12,8,0]),_(new r(1,1,4),g,[e*12,16.8,0],[3,1.25,3],[0,Math.PI/4,0]);_(new r(1,1,e.zone===`mechanical`?4:6),g,[0,15.8,0],[17.2,7.4,11.6],[0,Math.PI/4,0]),$(i,t,new Te(.85,1),l,[0,23,0],[1.2,1.8,1.2]);for(let e of[-9,-3,3,9])$(i,t,B(2.2,2,.12,.03),l,[e,5,10.65]);e.zone===`water`?$(i,t,B(36,.24,1.2,.05),l,[0,9.9,10.4]):e.zone===`volcanic`&&m(i,new V(.9,1.1,6.4,10),l,[0,11.8,-1.5]),h(i,e,d,g),v(i,e,d,g),i.traverse(e=>{e instanceof G&&(e.castShadow=e.userData.skylineShadowCaster===!0,e.receiveShadow=!0)}),m(i,B(38,.28,5.6,.08),g,[0,.22,12.55]),m(i,B(34,.24,2.6,.06),d,[0,.5,14]);for(let e of[-15.2,15.2])m(i,new V(.58,.72,7.4,12),d,[e,4.15,11.3]),m(i,B(2,.32,1.7,.06),g,[e,7.95,11.3]);m(i,B(32,.72,1.15,.08),g,[0,8,11.3]);let S=m(i,new H(4.1,.22,8,28,Math.PI),g,[0,5.3,11.48]);S.rotation.y=Math.PI,o.add(i)}),o}function Tn(){return[{kind:`ground`,p:[q[0],K-.65,q[2]],size:[620,1.3,600],color:9412227,surface:`stone`},{kind:`ground`,p:[q[0],K-.46,q[2]],size:[260,.28,260],color:11704426,surface:`stone`},{kind:`ground`,p:[1450,K-.65,1750],size:[900,1.3,1700],color:7179608,surface:`stone`}]}function En(e){let t=new Set,n=new Set,r=new Set;e.traverse(e=>{e instanceof G&&(t.add(e.geometry),(Array.isArray(e.material)?e.material:[e.material]).forEach(e=>{n.add(e);for(let t of[`map`,`normalMap`,`roughnessMap`,`alphaMap`,`emissiveMap`]){let n=e[t];n instanceof ye&&r.add(n)}}))}),e.removeFromParent(),r.forEach(e=>e.dispose()),n.forEach(e=>e.dispose()),t.forEach(e=>e.dispose())}function Dn(e,t,n,r,i){let a=new P;a.name=`Floating attraction entrance · ${i.publicName}`,a.position.set(i.entry[0],i.entry[1],i.entry[2]-11),e.add(a);let o=new I({color:_n(i.zone),roughness:.46,metalness:.16}),s=new I({color:i.isCastle?10132107:10128240,roughness:.88,metalness:.06}),c=new I({color:2440766,roughness:.42,metalness:.62});n.add(o).add(s).add(c);let l=hn(t,B(.68,3.45,.68,.12)),u=hn(t,B(1.05,.28,1.05,.08));for(let e of[-1,1]){R(a,l,s,[e*8.5,1.72,0]),R(a,u,o,[e*8.5,3.52,0]);let n=new G(hn(t,new H(.7,.09,8,22)),o);n.position.set(e*8.5,2.7,-.46),n.rotation.x=Math.PI/2,a.add(n)}let d=R(a,B(16,.52,.72,.12),s,[0,3.5,0]);d.castShadow=d.receiveShadow=!0;let f=R(a,new Te(.72),o,[0,4.25,0],[1,1.35,1]);t.add(f.geometry);let p=R(a,B(10.5,1.18,.18,.12),c,[0,4.85,.12]);p.rotation.x=-.12,gn(a,t,n,r,i.publicName,`#fff6d8`,`#${_n(i.zone).toString(16).padStart(6,`0`)}`,[0,4.85,.24],[9.6,.86]);let m=new Se(_n(i.zone),i.isCastle?3.2:1.5,i.isCastle?26:15);m.position.set(0,1.9,1.2),a.add(m);let h=hn(t,new z(1.5,2.2,3,4)),g=new I({color:_n(i.zone),roughness:.9,side:2});n.add(g);let _=new G(h,g);return _.position.set(0,4.55,-.04),_.name=`Animated flag · ${i.publicName}`,a.add(_),a.userData.attractionId=i.id,a.userData.flag=_,a}function On(e,t,n){let i=new P;i.name=`Floating City · jungle and ancient ruins amusement park`,t.add(i);let a=new Se(16761453,3,210,2);a.position.set(q[0]-22,K+16,q[2]+12),a.castShadow=!1,a.name=`Park plaza warm lantern fill`;let o=new Se(6870995,2,180,2);o.position.set(q[0]+115,K+7,q[2]-40),o.castShadow=!1,o.name=`Lagoon turquoise bounce light`;let s=new f(10210786,.52);s.position.set(q[0]-360,K+280,q[2]+240),s.target.position.set(q[0],K,q[2]),s.castShadow=!1,s.name=`Park cool mountain rim light`;let c=new f(11066605,.42);c.position.set(q[0]-260,K+260,q[2]+320),c.target.position.set(q[0],K,q[2]),c.castShadow=!1,c.name=`Park broad cyan sky fill`,i.add(a,o,s,s.target,c,c.target);let l=new Set,u=new Set,d=new Set,p=new Map,m=e=>{let t=p.get(e);if(t)return t;let r=n.path.clone();return r.color.set(e),r.roughness=.82,r.normalScale.set(.62,.62),p.set(e,r),u.add(r),r},h={geometries:l,materials:u,textures:d},g=Ve,_=Tn(),x=g.filter(e=>!e.isCastle),S=_.map(n=>se(e,t,{...n,surface:`stone`}));for(let e of S)e.visual.visible=!1;let C=[];for(let t of x){let n=new P;n.name=`Floating attraction route · ${t.publicName}`,i.add(n);let r=t.level.obstacles.map(r=>{let i=se(e,n,{...r,surface:`stone`});return i.visual.material=m(r.color??t.color),i});S.push(...r),Tt(n,t.level.checkpoints.map(e=>new b(...e)),t.color,t.publicName,{geometries:l,materials:u}),C.push({attraction:t,group:n})}let w=n.limestone.clone();w.color.set(13022343),w.roughness=.82;let E=n.bronze.clone();E.color.set(3165513),E.metalness=.72;let D=n.foliage.clone();D.color.set(5142856),D.roughness=1;let O=n.bark.clone();O.color.set(5982264);let k=n.foliage.clone();k.color.set(4158020),u.add(w).add(E).add(D).add(O).add(k);let j=n.grass.clone();j.color.set(7179608),j.roughness=.96,u.add(j);let M=new Me;M.absarc(0,0,335,0,Math.PI*2,!1);let ee=new be;ee.absellipse(115,40,115,70,0,Math.PI*2,!0,0),M.holes.push(ee);let N=new Ie(M,{depth:.18,bevelEnabled:!1,curveSegments:96});N.rotateX(-Math.PI/2);let te=new G(hn(l,N),j);te.position.set(q[0],K-.12,q[2]),te.receiveShadow=!0,te.name=`High-detail jungle park island ground`,i.add(te);let F=new Me;F.moveTo(-430,-820),F.lineTo(395,-820),F.lineTo(448,-610),F.lineTo(430,160),F.lineTo(390,820),F.lineTo(-320,850),F.lineTo(-450,530),F.lineTo(-452,-420),F.closePath();let ne=new Ie(F,{depth:.16,bevelEnabled:!0,bevelThickness:.08,bevelSize:.12,bevelSegments:2,curveSegments:8});ne.rotateX(-Math.PI/2);let re=new G(hn(l,ne),j);re.position.set(1450,K-.52,1750),re.receiveShadow=!0,re.name=`Continuous jungle terrain around attraction field`,i.add(re);let ie=vn(u,w.clone());ie.color.set(12166780),ie.roughness=.86;let ae=vn(u,E.clone());ae.color.set(3560781),ae.roughness=.68,ae.metalness=.36;let oe=(e,t)=>{let n=new G(hn(l,B(e[0]+1.4,.08,e[2]+1.4,.035)),ae);n.position.set(t[0],K-.045,t[2]),n.receiveShadow=!0,n.name=`Ancient park promenade edge`,i.add(n);let r=new G(hn(l,B(...e,.055)),ie);r.position.set(t[0],K+.015,t[2]),r.receiveShadow=!0,r.name=`Ancient park promenade paving`,i.add(r)};oe([34,.12,1580],[1285,0,1750]);for(let e of[2470,1960,1450])oe([500,.12,26],[1540,0,e]);let ce=new Me;ce.absarc(0,0,128,0,Math.PI*2,!1);let le=new be;le.absellipse(115,40,115,70,0,Math.PI*2,!0,0),ce.holes.push(le);let ue=new Ie(ce,{depth:.35,bevelEnabled:!1,curveSegments:64});ue.rotateX(-Math.PI/2);let de=new G(hn(l,ue),w);de.position.set(q[0],K+.01,q[2]),de.receiveShadow=!0,de.name=`Central exploration plaza`,i.add(de);for(let e of[92,112]){let t=new G(hn(l,new H(e,.42,8,96)),E);t.rotation.x=Math.PI/2,t.position.set(q[0],K+.46,q[2]),i.add(t)}let fe=bn(i,l,u,d,w,E,D,O,k);gn(i,l,u,d,`浮遊城遊樂園`,`#fff5d5`,`#264c47`,[q[0],K+10.35,q[2]-35],[16,3.1]),gn(i,l,u,d,`按 M 開啟設施快捷線 · 走到入口按 E`,`#eaf8e4`,`#3b6e53`,[q[0],K+8.25,q[2]-35],[20,1.9]);let L=g.map(e=>Dn(i,l,u,d,e)),R=Sn(i,l,u,d,g,w,E),pe=ln(i,h,[q[0]+115,K+.1,q[2]-40]),me=hn(l,new V(.22,.42,1,10)),he=hn(l,new y(1,2)),ge=new v(me,O,320),ve=new v(he,k,320),ye=hn(l,new r(1,1,8)),W=new v(ye,D,560);ge.name=`Instanced jungle trunks`,ve.name=`Instanced layered jungle crowns`,W.name=`Instanced jungle fern understory`,ge.castShadow=ve.castShadow=!0,ge.receiveShadow=ve.receiveShadow=!0,W.castShadow=!0,W.receiveShadow=!0,i.add(ge,ve,W);let xe=q[0],Ce=q[2],we=0;for(let e=0;e<320;e++){let t=pn(e,4)*fn,n=112+pn(e,7)*1050,r=xe+Math.cos(t)*n,i=Ce+Math.sin(t)*n;if(x.some(e=>Math.abs(r-e.spawn[0])<12&&i<e.spawn[2]+24&&i>e.level.finish[2]-24)||Math.abs(r-xe)<95&&Math.abs(i-Ce)<95)continue;let a=9+pn(e,11)*13,o=.75+pn(e,13)*1.05;mn(ge,we,new b(r,K+a*.34,i),new b(o,a*.72,o)),mn(ve,we,new b(r,K+a*.86,i),new b(a*.26,a*.32,a*.26),new U().setFromEuler(new A(pn(e,17)*.2,pn(e,19)*fn,0))),ve.setColorAt(we,new T().setHSL(.26+pn(e,23)*.07,.32+pn(e,29)*.3,.25+pn(e,31)*.22)),we++}ge.count=ve.count=we,ge.instanceMatrix.needsUpdate=ve.instanceMatrix.needsUpdate=!0,ve.instanceColor&&(ve.instanceColor.needsUpdate=!0);let Ee=0;for(let e=0;e<560;e++){let t=pn(e,69)*fn,n=96+pn(e,73)*920,r=xe+Math.cos(t)*n,i=Ce+Math.sin(t)*n;if(x.some(e=>Math.abs(r-e.spawn[0])<16&&i<e.spawn[2]+18&&i>e.level.finish[2]-18)||Math.abs(r-xe)<92&&Math.abs(i-Ce)<92)continue;let a=1.2+pn(e,79)*2.8;mn(W,Ee,new b(r,K+a*.5,i),new b(.7+pn(e,83)*.7,a,.7+pn(e,89)*.7),new U().setFromEuler(new A(0,pn(e,97)*fn,0))),W.setColorAt(Ee,new T().setHSL(.25+pn(e,101)*.08,.34+pn(e,103)*.3,.23+pn(e,107)*.2)),Ee++}W.count=Ee,W.instanceMatrix.needsUpdate=!0,W.instanceColor&&(W.instanceColor.needsUpdate=!0);let De=hn(l,B(2.3,4.5,2.3,.18)),Oe=new v(De,w,96);Oe.name=`Instanced ancient ruin fragments`,Oe.castShadow=Oe.receiveShadow=!0,i.add(Oe);for(let e=0;e<Oe.count;e++){let t=e/Oe.count*fn+pn(e,41)*.18,n=145+pn(e,43)*120,r=1.5+pn(e,47)*5.5;mn(Oe,e,new b(xe+Math.cos(t)*n,K+r/2,Ce+Math.sin(t)*n),new b(.7+pn(e,49)*.75,r/4.5,.7+pn(e,53)*.75),new U().setFromEuler(new A(0,pn(e,59)*fn,pn(e,61)*.12)))}Oe.instanceMatrix.needsUpdate=!0;let ke=new P;ke.name=`Attraction checkpoint beacon details`,i.add(ke);let Ae=hn(l,new Te(.22,0)),je=new I({color:16769184,emissive:13797943,emissiveIntensity:1.4,roughness:.22,metalness:.35});u.add(je);for(let e of x)e.level.checkpoints.forEach((t,n)=>{let r=new G(Ae,je);r.position.set(t[0],t[1]+1.25,t[2]),r.scale.setScalar(n===0?1.25:.82),r.userData.attractionId=e.id,r.userData.phase=n*.7+e.lengthMeters*.01,r.userData.baseY=r.position.y,ke.add(r)});let Ne=new _e({color:3972772,roughness:.14,metalness:.06,transmission:.08,transparent:!0,opacity:.78,clearcoat:.8,clearcoatRoughness:.12});u.add(Ne);let Pe={stone:w,foliage:D,water:Ne,dark:E,gold:vn(u,n.gold.clone())},Fe=g.map(e=>({attraction:e,group:xn(i,l,u,d,e,Pe,n)})),Le=Fe.map(({group:e})=>e);Cn(i,l,u);let Re=wn(i,l,u,g,n),ze=un(i,l,u,d),Be=[],He=1;for(let[e,t,n,r]of[[1320,1750,24,18],[1960,1180,32,23],[1240,720,28,16]]){let a=new G(hn(l,new z(n,r,8,16)),Ne);a.position.set(e,K+r/2,t),a.rotation.y=Math.PI,a.name=`Animated jungle waterfall`,i.add(a),Be.push(a)}let Ue=!1,J={meshes:0,vertices:0,hemisphereSamples:5};i.userData.floatingVertexAO=J;let We=window.setTimeout(()=>{Ue||(Object.assign(J,dn(i,l,u)),i.userData.floatingVertexAO=J)},700),Ge=null,Ke=new Map(g.map(e=>[e.id,new b(...e.entry)])),qe=new b(...q),Je=!0,Ye=e=>Ge===e.id||qe.distanceToSquared(Ke.get(e.id))<=(Ge?9e4:211600),Xe=()=>{L.forEach((e,t)=>{e.visible=Ge===null&&Ye(g[t])}),Fe.forEach(({attraction:e,group:t})=>{t.visible=Ye(e)}),C.forEach(({attraction:e,group:t})=>{t.visible=Ye(e)}),Je=!1};return{obstacles:S,attractions:g,hubSpawn:q,architectureCount:Fe.length,reflectionSurfaceCount:2,backgroundStats:ze.stats,vertexAO:J,nearestAttraction:e=>{let t=null,n=1/0;for(let r of g){let i=Ke.get(r.id),a=Math.hypot(e.x-i.x,e.z-i.z,(e.y-i.y)*.5);a<n&&a<18&&(n=a,t=r)}return t},getAttraction:e=>g.find(t=>t.id===e)??null,setFocus(e){Ge=e===`floating-hub`?null:e;let t=Ge===null;fe.visible=t,R.visible=t,Re.visible=t,ke.children.forEach(e=>{e.visible=t||e.userData.attractionId===Ge}),pe.setVisible(Ge===null),Je=!0,Xe()},setVisible(e){i.visible=e},update(e,t,n){n&&(Je||n.distanceToSquared(qe)>256)&&(qe.copy(n),Xe()),ze.update(e),L.forEach((t,n)=>{let r=t.userData.flag;r&&(r.rotation.y=Math.sin(e*1.4+n)*.16,r.rotation.z=Math.sin(e*1.1+n*.7)*.05)}),ke.children.forEach((t,n)=>{t.position.y=t.userData.baseY+Math.sin(e*2.4+n*.43)*.12,t.rotation.y=e*.9+n}),pe.update(e),Le.forEach(e=>{e.visible&&e.userData.dynamics?.forEach(({mesh:e,rate:n})=>{e.rotation.y+=n*t})}),Be.forEach((t,n)=>{let r=t.material;r.opacity=.68+Math.sin(e*2.1+n)*.08,t.scale.set(He*(.96+Math.sin(e*2.7+n)*.035),He,He)})},setQuality(e,t){ge.castShadow=ve.castShadow=Oe.castShadow=e,W.castShadow=!1,Le.forEach(t=>{t.traverse(t=>{t instanceof G&&(t.castShadow=e)})}),Re.traverse(t=>{t instanceof G&&(t.castShadow=e&&t.userData.skylineShadowCaster===!0,t.receiveShadow=e)});let n=e?t?.92:1:.76;He=n,Be.forEach(e=>{e.material=Ne,e.scale.setScalar(n)}),pe.setQuality(e,t),ze.setQuality(e,t)},dispose(){if(!Ue){Ue=!0,window.clearTimeout(We);for(let t of S)e.removeRigidBody(t.body),En(t.visual);i.removeFromParent(),l.forEach(e=>e.dispose()),u.forEach(e=>e.dispose()),d.forEach(e=>e.dispose()),pe.dispose(),i.clear()}}}}var kn=4.2,An=Math.PI*2,jn=[1160,1530],Mn=[980,1340],Nn=Math.atan2(...Mn),Pn=1780,Fn=e=>{let t=k.clamp(e,0,1);return t*t*t*(t*(t*6-15)+10)},In=class{meadowHeight;mode;duration;camera=new Oe(50,1,.5,1e4);target=new b;startPoint;elapsed=0;orbitAngle=0;currentShot=`meadow`;currentShotProgress=0;entryCamera=new b;entryTarget=new b;parkCurve;constructor(e=[0,80,512],t=()=>0,n=`castle`){this.meadowHeight=t,this.mode=n,this.startPoint=e instanceof b?e.clone():new b(...e),this.entryCamera.copy(this.startPoint).add(new b(-8,5,10)),this.entryTarget.copy(this.startPoint).add(new b(0,1,0)),this.duration=this.mode===`park`?kn:76,this.parkCurve=this.mode===`park`?new u([this.startPoint.clone().add(new b(118,44,150)),this.startPoint.clone().add(new b(24,72,78)),this.startPoint.clone().add(new b(-92,37,-76)),this.entryCamera.clone()],!1,`centripetal`,.42):null,this.camera.name=`Aincrad cinematic camera`,this.update(0,1)}get time(){return this.elapsed}get finished(){return this.elapsed>=this.duration}get frame(){let e={meadow:[`群山之上`,`穿過高山草原，尋找雲海中的浮遊城`],approach:[`浮遊城`,`一百層的天際，懸浮於雲與光之間`],orbit:[`環城巡禮`,`完整環視浮遊城，從基座仰望最高王座`],facade:[`天空聖堂`,`掠過層疊城區，仰望雲端的尖塔與彩窗`],arrival:[`向天空啟程`,`沿城外螺旋古道，一路攀向最頂端`],"park-establishing":[`雲海遊園`,`俯瞰叢林遺跡與二十座可遊玩的設施`],"park-sweep":[`穿越園區`,`掠過水道、古門與遠方的浮遊城`],"park-arrival":[`開始探索`,`鏡頭回到旅人身旁，準備踏入遊樂園`]}[this.currentShot];return{shot:this.currentShot,mode:this.mode,label:e[0],subtitle:e[1],progress:this.elapsed/this.duration,shotProgress:this.currentShotProgress,time:this.elapsed,finished:this.finished,orbitRadians:this.orbitAngle,orbitDegrees:k.radToDeg(this.orbitAngle),position:this.camera.position.toArray(),target:this.target.toArray()}}update(e,t){this.elapsed=k.clamp(Number.isFinite(e)?e:0,0,this.duration),Number.isFinite(t)&&t>0&&(this.camera.aspect=t);let n=this.elapsed,r=this.camera;if(this.mode===`park`&&this.parkCurve){let e=n/this.duration,t=Fn(e);return r.position.copy(this.parkCurve.getPoint(t)),this.target.copy(this.startPoint).add(new b(-28,8,-34)).lerp(this.entryTarget,Fn(k.smoothstep(t,.52,1))),r.fov=k.lerp(57,54,t),this.orbitAngle=0,e<.34?(this.currentShot=`park-establishing`,this.currentShotProgress=e/.34):e<.76?(this.currentShot=`park-sweep`,this.currentShotProgress=(e-.34)/.42):(this.currentShot=`park-arrival`,this.currentShotProgress=(e-.76)/.24),r.updateProjectionMatrix(),r.lookAt(this.target),r.updateMatrixWorld(),this.frame}if(n<11){this.currentShot=`meadow`,this.currentShotProgress=n/11;let e=Fn(this.currentShotProgress);r.position.set(k.lerp(jn[0],Mn[0],e),0,k.lerp(jn[1],Mn[1],e));let t=Fn((n-3.5)/7.5);r.position.y=this.meadowHeight(r.position.x,r.position.z)+3.2+70.8*t,this.target.set(0,k.lerp(100,290,e),0),r.fov=k.lerp(55,48,e),this.orbitAngle=0}else if(n<17){this.currentShot=`approach`,this.currentShotProgress=(n-11)/6;let e=Fn(this.currentShotProgress),t=k.lerp(Math.hypot(...Mn),Pn,e);r.position.set(Math.sin(Nn)*t,k.lerp(this.meadowHeight(...Mn)+74,360,e),Math.cos(Nn)*t),this.target.set(0,k.lerp(290,315,e),0),r.fov=k.lerp(48,52,e),this.orbitAngle=0}else if(n<45){this.currentShot=`orbit`,this.currentShotProgress=(n-17)/28;let e=Fn(this.currentShotProgress),t=Math.sin(Math.PI*e),i=Pn-180*t;this.orbitAngle=An*e;let a=Nn+this.orbitAngle;r.position.set(Math.sin(a)*i,360+80*e+110*t,Math.cos(a)*i),this.target.set(0,315+38*t,0),r.fov=52-3*t}else if(n<63){this.currentShot=`facade`,this.currentShotProgress=(n-45)/18;let e=Fn(this.currentShotProgress),t=Nn-.48*e,i=k.lerp(Pn,410,e);r.position.set(Math.sin(t)*i,440+295*e,Math.cos(t)*i),this.target.set(0,k.lerp(315,700,e),0),r.fov=k.lerp(52,48,e),this.orbitAngle=An}else{this.currentShot=`arrival`,this.currentShotProgress=(n-63)/13;let e=Fn(this.currentShotProgress),t=Math.atan2(this.entryCamera.x,this.entryCamera.z),i=Math.atan2(Math.sin(t-(Nn-.48)),Math.cos(t-(Nn-.48))),a=Nn-.48+i*e,o=k.lerp(410,Math.hypot(this.entryCamera.x,this.entryCamera.z),e);r.position.set(Math.sin(a)*o,k.lerp(735,this.entryCamera.y,e),Math.cos(a)*o),this.target.set(0,700,0).lerp(this.entryTarget,Fn(k.smoothstep(e,.15,1))),r.fov=k.lerp(48,55,e),this.orbitAngle=An}return r.updateProjectionMatrix(),r.lookAt(this.target),r.updateMatrixWorld(),this.frame}},Ln={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`},Rn=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},zn=new ue(-1,1,1,-1,0,1),Bn=new class extends o{constructor(){super(),this.setAttribute(`position`,new a([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new a([0,2,0,0,2,0],2))}},Vn=class{constructor(e){this._mesh=new G(Bn,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,zn)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},Hn=class extends Rn{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof s?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=w.clone(e.uniforms),this.material=new s({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new Vn(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},Un=class extends Rn{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},Wn=class extends Rn{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},Gn=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new _);this._width=n.width,this._height=n.height,t=new Le(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:F}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Hn(Ln),this.copyPass.material.blending=0,this.timer=new i}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}Un!==void 0&&(r instanceof Un?n=!0:r instanceof Wn&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new _);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},Kn=class extends Rn{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new T}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},qn={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new T(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`},Jn=class e extends Rn{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e===void 0?new _(256,256):new _(e.x,e.y),this.clearColor=new T(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new Le(i,a,{type:F}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new Le(i,a,{type:F});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new Le(i,a,{type:F});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),i=Math.round(i/2),a=Math.round(a/2)}let o=qn;this.highPassUniforms=w.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new s({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let c=[6,10,14,18,22];i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(c[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new _(1/i,1/a),i=Math.round(i/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let l=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=l,this.bloomTintColors=[new b(1,1,1),new b(1,1,1),new b(1,1,1),new b(1,1,1),new b(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=w.clone(Ln.uniforms),this.blendMaterial=new s({uniforms:this.copyUniforms,vertexShader:Ln.vertexShader,fragmentShader:Ln.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new T,this._oldClearAlpha=1,this._basic=new W,this._fsQuad=new Vn(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new _(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(t,n,r,i,a){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this._fsQuad.render(t),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(r),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);return new s({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new _(.5,.5)},direction:{value:new _(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

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

				}`})}_getCompositeMaterial(e){return new s({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

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

				}`})}};Jn.BlurDirectionX=new _(1,0),Jn.BlurDirectionY=new _(0,1);var Yn={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`},Xn=class extends Rn{constructor(){super(),this.isOutputPass=!0,this.uniforms=w.clone(Yn.uniforms),this.material=new me({name:Yn.name,uniforms:this.uniforms,vertexShader:Yn.vertexShader,fragmentShader:Yn.fragmentShader}),this._fsQuad=new Vn(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},ve.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},Zn={name:`FXAAShader`,uniforms:{tDiffuse:{value:null},resolution:{value:new _(1/1024,1/512)}},vertexShader:`

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

		}`},Qn=class extends Hn{constructor(){super(Zn)}setSize(e,t){this.material.uniforms.resolution.value.set(1/e,1/t)}},$n={name:`GTAOShader`,defines:{PERSPECTIVE_CAMERA:1,SAMPLES:16,NORMAL_VECTOR_TYPE:1,DEPTH_SWIZZLING:`x`,SCREEN_SPACE_RADIUS:0,SCREEN_SPACE_RADIUS_SCALE:100,SCENE_CLIP_BOX:0},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new _},cameraNear:{value:null},cameraFar:{value:null},cameraProjectionMatrix:{value:new L},cameraProjectionMatrixInverse:{value:new L},cameraWorldMatrix:{value:new L},radius:{value:.25},distanceExponent:{value:1},thickness:{value:1},distanceFallOff:{value:1},scale:{value:1},sceneBoxMin:{value:new b(-1,-1,-1)},sceneBoxMax:{value:new b(1,1,1)}},vertexShader:`

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
		}`},er={name:`GTAODepthShader`,defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`
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

		}`},tr={name:`GTAOBlendShader`,uniforms:{tDiffuse:{value:null},intensity:{value:1}},vertexShader:`
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
		}`};function nr(e=5){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),n=rr(t),r=n.length,i=new Uint8Array(r*4);for(let e=0;e<r;++e){let t=n[e],a=2*Math.PI*t/r,o=new b(Math.cos(a),Math.sin(a),0).normalize();i[e*4]=(o.x*.5+.5)*255,i[e*4+1]=(o.y*.5+.5)*255,i[e*4+2]=127,i[e*4+3]=255}let a=new x(i,t,t);return a.wrapS=Ae,a.wrapT=Ae,a.needsUpdate=!0,a}function rr(e){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),n=t*t,r=Array(n).fill(0),i=Math.floor(t/2),a=t-1;for(let e=1;e<=n;){if(i===-1&&a===t?(a=t-2,i=0):(a===t&&(a=0),i<0&&(i=t-1)),r[i*t+a]!==0){a-=2,i++;continue}r[i*t+a]=e++,a++,i--}return r}var ir={name:`PoissonDenoiseShader`,defines:{SAMPLES:16,SAMPLE_VECTORS:ar(16,2,1),NORMAL_VECTOR_TYPE:1,DEPTH_VALUE_SOURCE:0},uniforms:{tDiffuse:{value:null},tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new _},cameraProjectionMatrixInverse:{value:new L},lumaPhi:{value:5},depthPhi:{value:5},normalPhi:{value:5},radius:{value:4},index:{value:0}},vertexShader:`

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
		}`};function ar(e,t,n){let r=or(e,t,n),i=`vec3[SAMPLES](`;for(let t=0;t<e;t++){let n=r[t];i+=`vec3(${n.x}, ${n.y}, ${n.z})${t<e-1?`,`:`)`}`}return i}function or(e,t,n){let r=[];for(let i=0;i<e;i++){let a=2*Math.PI*t*i/e,o=(i/(e-1))**n;r.push(new b(Math.cos(a),Math.sin(a),o))}return r}var sr=class{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(e.random()*256);this.perm=[];for(let e=0;e<512;e++)this.perm[e]=this.p[e&255];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}noise(e,t){let n,r,i,a=.5*(Math.sqrt(3)-1),o=(e+t)*a,s=Math.floor(e+o),c=Math.floor(t+o),l=(3-Math.sqrt(3))/6,u=(s+c)*l,d=s-u,f=c-u,p=e-d,m=t-f,h,g;p>m?(h=1,g=0):(h=0,g=1);let _=p-h+l,v=m-g+l,y=p-1+2*l,b=m-1+2*l,x=s&255,S=c&255,C=this.perm[x+this.perm[S]]%12,w=this.perm[x+h+this.perm[S+g]]%12,T=this.perm[x+1+this.perm[S+1]]%12,E=.5-p*p-m*m;E<0?n=0:(E*=E,n=E*E*this._dot(this.grad3[C],p,m));let D=.5-_*_-v*v;D<0?r=0:(D*=D,r=D*D*this._dot(this.grad3[w],_,v));let O=.5-y*y-b*b;return O<0?i=0:(O*=O,i=O*O*this._dot(this.grad3[T],y,b)),70*(n+r+i)}noise3d(e,t,n){let r,i,a,o,s=(e+t+n)*(1/3),c=Math.floor(e+s),l=Math.floor(t+s),u=Math.floor(n+s),d=1/6,f=(c+l+u)*d,p=c-f,m=l-f,h=u-f,g=e-p,_=t-m,v=n-h,y,b,x,S,C,w;g>=_?_>=v?(y=1,b=0,x=0,S=1,C=1,w=0):g>=v?(y=1,b=0,x=0,S=1,C=0,w=1):(y=0,b=0,x=1,S=1,C=0,w=1):_<v?(y=0,b=0,x=1,S=0,C=1,w=1):g<v?(y=0,b=1,x=0,S=0,C=1,w=1):(y=0,b=1,x=0,S=1,C=1,w=0);let T=g-y+d,E=_-b+d,D=v-x+d,O=g-S+2*d,k=_-C+2*d,A=v-w+2*d,j=g-1+3*d,M=_-1+3*d,ee=v-1+3*d,N=c&255,te=l&255,P=u&255,F=this.perm[N+this.perm[te+this.perm[P]]]%12,ne=this.perm[N+y+this.perm[te+b+this.perm[P+x]]]%12,re=this.perm[N+S+this.perm[te+C+this.perm[P+w]]]%12,ie=this.perm[N+1+this.perm[te+1+this.perm[P+1]]]%12,ae=.6-g*g-_*_-v*v;ae<0?r=0:(ae*=ae,r=ae*ae*this._dot3(this.grad3[F],g,_,v));let oe=.6-T*T-E*E-D*D;oe<0?i=0:(oe*=oe,i=oe*oe*this._dot3(this.grad3[ne],T,E,D));let se=.6-O*O-k*k-A*A;se<0?a=0:(se*=se,a=se*se*this._dot3(this.grad3[re],O,k,A));let I=.6-j*j-M*M-ee*ee;return I<0?o=0:(I*=I,o=I*I*this._dot3(this.grad3[ie],j,M,ee)),32*(r+i+a+o)}noise4d(e,t,n,r){let i=this.grad4,a=this.simplex,o=this.perm,s=(Math.sqrt(5)-1)/4,c=(5-Math.sqrt(5))/20,l,u,d,f,p,m=(e+t+n+r)*s,h=Math.floor(e+m),g=Math.floor(t+m),_=Math.floor(n+m),v=Math.floor(r+m),y=(h+g+_+v)*c,b=h-y,x=g-y,S=_-y,C=v-y,w=e-b,T=t-x,E=n-S,D=r-C,O=w>T?32:0,k=w>E?16:0,A=T>E?8:0,j=w>D?4:0,M=T>D?2:0,ee=+(E>D),N=O+k+A+j+M+ee,te=+(a[N][0]>=3),P=+(a[N][1]>=3),F=+(a[N][2]>=3),ne=+(a[N][3]>=3),re=+(a[N][0]>=2),ie=+(a[N][1]>=2),ae=+(a[N][2]>=2),oe=+(a[N][3]>=2),se=+(a[N][0]>=1),I=+(a[N][1]>=1),ce=+(a[N][2]>=1),le=+(a[N][3]>=1),ue=w-te+c,de=T-P+c,fe=E-F+c,L=D-ne+c,R=w-re+2*c,z=T-ie+2*c,pe=E-ae+2*c,me=D-oe+2*c,B=w-se+3*c,he=T-I+3*c,ge=E-ce+3*c,_e=D-le+3*c,V=w-1+4*c,H=T-1+4*c,ve=E-1+4*c,ye=D-1+4*c,be=h&255,U=g&255,W=_&255,xe=v&255,Se=o[be+o[U+o[W+o[xe]]]]%32,Ce=o[be+te+o[U+P+o[W+F+o[xe+ne]]]]%32,we=o[be+re+o[U+ie+o[W+ae+o[xe+oe]]]]%32,Te=o[be+se+o[U+I+o[W+ce+o[xe+le]]]]%32,Ee=o[be+1+o[U+1+o[W+1+o[xe+1]]]]%32,G=.6-w*w-T*T-E*E-D*D;G<0?l=0:(G*=G,l=G*G*this._dot4(i[Se],w,T,E,D));let De=.6-ue*ue-de*de-fe*fe-L*L;De<0?u=0:(De*=De,u=De*De*this._dot4(i[Ce],ue,de,fe,L));let Oe=.6-R*R-z*z-pe*pe-me*me;Oe<0?d=0:(Oe*=Oe,d=Oe*Oe*this._dot4(i[we],R,z,pe,me));let ke=.6-B*B-he*he-ge*ge-_e*_e;ke<0?f=0:(ke*=ke,f=ke*ke*this._dot4(i[Te],B,he,ge,_e));let Ae=.6-V*V-H*H-ve*ve-ye*ye;return Ae<0?p=0:(Ae*=Ae,p=Ae*Ae*this._dot4(i[Ee],V,H,ve,ye)),27*(l+u+d+f+p)}_dot(e,t,n){return e[0]*t+e[1]*n}_dot3(e,t,n,r){return e[0]*t+e[1]*n+e[2]*r}_dot4(e,t,n,r,i){return e[0]*t+e[1]*n+e[2]*r+e[3]*i}},cr=class e extends Rn{constructor(e,t,n=512,r=512,i,a,o){super(),this.width=n,this.height=r,this.clear=!0,this.camera=t,this.scene=e,this.output=0,this._renderGBuffer=!0,this._visibilityCache=[],this.blendIntensity=1,this.pdRings=2,this.pdRadiusExponent=2,this.pdSamples=16,this.gtaoNoiseTexture=nr(),this.pdNoiseTexture=this._generateNoise(),this.gtaoRenderTarget=new Le(this.width,this.height,{type:F}),this.pdRenderTarget=this.gtaoRenderTarget.clone(),this.gtaoMaterial=new s({defines:Object.assign({},$n.defines),uniforms:w.clone($n.uniforms),vertexShader:$n.vertexShader,fragmentShader:$n.fragmentShader,blending:0,depthTest:!1,depthWrite:!1}),this.gtaoMaterial.defines.PERSPECTIVE_CAMERA=+!!this.camera.isPerspectiveCamera,this.gtaoMaterial.uniforms.tNoise.value=this.gtaoNoiseTexture,this.gtaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.normalMaterial=new we,this.normalMaterial.blending=0,this.pdMaterial=new s({defines:Object.assign({},ir.defines),uniforms:w.clone(ir.uniforms),vertexShader:ir.vertexShader,fragmentShader:ir.fragmentShader,depthTest:!1,depthWrite:!1}),this.pdMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.pdMaterial.uniforms.tNoise.value=this.pdNoiseTexture,this.pdMaterial.uniforms.resolution.value.set(this.width,this.height),this.pdMaterial.uniforms.lumaPhi.value=10,this.pdMaterial.uniforms.depthPhi.value=2,this.pdMaterial.uniforms.normalPhi.value=3,this.pdMaterial.uniforms.radius.value=8,this.depthRenderMaterial=new s({defines:Object.assign({},er.defines),uniforms:w.clone(er.uniforms),vertexShader:er.vertexShader,fragmentShader:er.fragmentShader,blending:0}),this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new s({uniforms:w.clone(Ln.uniforms),vertexShader:Ln.vertexShader,fragmentShader:Ln.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:208,blendDst:200,blendEquation:100,blendSrcAlpha:206,blendDstAlpha:200,blendEquationAlpha:100}),this.blendMaterial=new s({uniforms:w.clone(tr.uniforms),vertexShader:tr.vertexShader,fragmentShader:tr.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blending:5,blendSrc:208,blendDst:200,blendEquation:100,blendSrcAlpha:206,blendDstAlpha:200,blendEquationAlpha:100}),this._fsQuad=new Vn(null),this._originalClearColor=new T,this.setGBuffer(i?i.depthTexture:void 0,i?i.normalTexture:void 0),a!==void 0&&this.updateGtaoMaterial(a),o!==void 0&&this.updatePdMaterial(o)}setSize(e,t){this.width=e,this.height=t,this.gtaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.pdRenderTarget.setSize(e,t),this.gtaoMaterial.uniforms.resolution.value.set(e,t),this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.pdMaterial.uniforms.resolution.value.set(e,t),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse)}dispose(){this.gtaoNoiseTexture.dispose(),this.pdNoiseTexture.dispose(),this.normalRenderTarget.dispose(),this.gtaoRenderTarget.dispose(),this.pdRenderTarget.dispose(),this.normalMaterial.dispose(),this.pdMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this._fsQuad.dispose()}get gtaoMap(){return this.pdRenderTarget.texture}setGBuffer(e,t){e===void 0?(this.depthTexture=new D,this.depthTexture.format=C,this.depthTexture.type=p,this.normalRenderTarget=new Le(this.width,this.height,{minFilter:xe,magFilter:xe,type:F,depthTexture:this.depthTexture}),this.normalTexture=this.normalRenderTarget.texture,this._renderGBuffer=!0):(this.depthTexture=e,this.normalTexture=t,this._renderGBuffer=!1);let n=+!!this.normalTexture,r=this.depthTexture===this.normalTexture?`w`:`x`;this.gtaoMaterial.defines.NORMAL_VECTOR_TYPE=n,this.gtaoMaterial.defines.DEPTH_SWIZZLING=r,this.gtaoMaterial.uniforms.tNormal.value=this.normalTexture,this.gtaoMaterial.uniforms.tDepth.value=this.depthTexture,this.pdMaterial.defines.NORMAL_VECTOR_TYPE=n,this.pdMaterial.defines.DEPTH_SWIZZLING=r,this.pdMaterial.uniforms.tNormal.value=this.normalTexture,this.pdMaterial.uniforms.tDepth.value=this.depthTexture,this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture}setSceneClipBox(e){e?(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX!==1,this.gtaoMaterial.defines.SCENE_CLIP_BOX=1,this.gtaoMaterial.uniforms.sceneBoxMin.value.copy(e.min),this.gtaoMaterial.uniforms.sceneBoxMax.value.copy(e.max)):(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX===0,this.gtaoMaterial.defines.SCENE_CLIP_BOX=0)}updateGtaoMaterial(e){e.radius!==void 0&&(this.gtaoMaterial.uniforms.radius.value=e.radius),e.distanceExponent!==void 0&&(this.gtaoMaterial.uniforms.distanceExponent.value=e.distanceExponent),e.thickness!==void 0&&(this.gtaoMaterial.uniforms.thickness.value=e.thickness),e.distanceFallOff!==void 0&&(this.gtaoMaterial.uniforms.distanceFallOff.value=e.distanceFallOff,this.gtaoMaterial.needsUpdate=!0),e.scale!==void 0&&(this.gtaoMaterial.uniforms.scale.value=e.scale),e.samples!==void 0&&e.samples!==this.gtaoMaterial.defines.SAMPLES&&(this.gtaoMaterial.defines.SAMPLES=e.samples,this.gtaoMaterial.needsUpdate=!0),e.screenSpaceRadius!==void 0&&+!!e.screenSpaceRadius!==this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS&&(this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS=+!!e.screenSpaceRadius,this.gtaoMaterial.needsUpdate=!0)}updatePdMaterial(e){let t=!1;e.lumaPhi!==void 0&&(this.pdMaterial.uniforms.lumaPhi.value=e.lumaPhi),e.depthPhi!==void 0&&(this.pdMaterial.uniforms.depthPhi.value=e.depthPhi),e.normalPhi!==void 0&&(this.pdMaterial.uniforms.normalPhi.value=e.normalPhi),e.radius!==void 0&&e.radius!==this.radius&&(this.pdMaterial.uniforms.radius.value=e.radius),e.radiusExponent!==void 0&&e.radiusExponent!==this.pdRadiusExponent&&(this.pdRadiusExponent=e.radiusExponent,t=!0),e.rings!==void 0&&e.rings!==this.pdRings&&(this.pdRings=e.rings,t=!0),e.samples!==void 0&&e.samples!==this.pdSamples&&(this.pdSamples=e.samples,t=!0),t&&(this.pdMaterial.defines.SAMPLES=this.pdSamples,this.pdMaterial.defines.SAMPLE_VECTORS=ar(this.pdSamples,this.pdRings,this.pdRadiusExponent),this.pdMaterial.needsUpdate=!0)}render(t,n,r){switch(this._renderGBuffer&&(this._overrideVisibility(),this._renderOverride(t,this.normalMaterial,this.normalRenderTarget,7829503,1),this._restoreVisibility()),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.gtaoMaterial.uniforms.cameraWorldMatrix.value.copy(this.camera.matrixWorld),this._renderPass(t,this.gtaoMaterial,this.gtaoRenderTarget,16777215,1),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this._renderPass(t,this.pdMaterial,this.pdRenderTarget,16777215,1),this.output){case e.OUTPUT.Off:break;case e.OUTPUT.Diffuse:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.AO:this.copyMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Denoise:this.copyMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Depth:this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this._renderPass(t,this.depthRenderMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n);break;case e.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=0,this._renderPass(t,this.copyMaterial,this.renderToScreen?null:n),this.blendMaterial.uniforms.intensity.value=this.blendIntensity,this.blendMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this._renderPass(t,this.blendMaterial,this.renderToScreen?null:n);break;default:console.warn(`THREE.GTAOPass: Unknown output type.`)}}_renderPass(e,t,n,r,i){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,r!=null&&(e.setClearColor(r),e.setClearAlpha(i||0),e.clear()),this._fsQuad.material=t,this._fsQuad.render(e),e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_renderOverride(e,t,n,r,i){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,r=t.clearColor||r,i=t.clearAlpha||i,r!=null&&(e.setClearColor(r),e.setClearAlpha(i||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_overrideVisibility(){let e=this.scene,t=this._visibilityCache;e.traverse(function(e){(e.isPoints||e.isLine||e.isLine2)&&e.visible&&(e.visible=!1,t.push(e))})}_restoreVisibility(){let e=this._visibilityCache;for(let t=0;t<e.length;t++)e[t].visible=!0;e.length=0}_generateNoise(e=64){let t=new sr,n=e*e*4,r=new Uint8Array(n);for(let n=0;n<e;n++)for(let i=0;i<e;i++){let a=n,o=i;r[(n*e+i)*4]=(t.noise(a,o)*.5+.5)*255,r[(n*e+i)*4+1]=(t.noise(a+e,o)*.5+.5)*255,r[(n*e+i)*4+2]=(t.noise(a,o+e)*.5+.5)*255,r[(n*e+i)*4+3]=(t.noise(a+e,o+e)*.5+.5)*255}let i=new x(r,e,e,he,O);return i.wrapS=Ae,i.wrapT=Ae,i.needsUpdate=!0,i}};cr.OUTPUT={Off:-1,Default:0,Diffuse:1,Depth:2,Normal:3,AO:4,Denoise:5};var lr=class{renderer;composer;renderPass;bloom;ao;output=new Xn;fxaa=new Qn;copyMaterial=new s({name:`Aincrad screen composite`,uniforms:{tDiffuse:{value:null},gradeContrast:{value:1},gradeSaturation:{value:1},gradeExposure:{value:1},texelSize:{value:new _(1/8,1/8)},sharpness:{value:0}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,fragmentShader:`uniform sampler2D tDiffuse; uniform float gradeContrast; uniform float gradeSaturation; uniform float gradeExposure; uniform vec2 texelSize; uniform float sharpness; varying vec2 vUv; void main(){
        vec3 c=texture2D(tDiffuse,vUv).rgb;
        vec3 blur=(texture2D(tDiffuse,vUv+vec2(texelSize.x,0.)).rgb+texture2D(tDiffuse,vUv-vec2(texelSize.x,0.)).rgb+texture2D(tDiffuse,vUv+vec2(0.,texelSize.y)).rgb+texture2D(tDiffuse,vUv-vec2(0.,texelSize.y)).rgb)*.25;
        float edge=clamp(length(c-blur)*3.2,0.,1.);
        c+=clamp(c-blur,-.12,.12)*sharpness*edge;
        float gradeLuminance=dot(c,vec3(.2126,.7152,.0722));
        c=mix(vec3(gradeLuminance),c,gradeSaturation);
        c=(c-vec3(.5))*gradeContrast+vec3(.5);
        c*=gradeExposure;
        float l=dot(c,vec3(.2126,.7152,.0722));
        c+=vec3(.013,.002,-.008)*smoothstep(.35,.9,l)+vec3(-.005,.002,.009)*(1.-smoothstep(.1,.45,l));
        vec2 p=vUv*2.-1.; float vignette=1.-.11*dot(p*.65,p*.65);
        float grain=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.003;
        gl_FragColor=vec4(c*vignette+grain,1.);
      }`,depthTest:!1,depthWrite:!1,blending:0,toneMapped:!1});copy=new Vn(this.copyMaterial);viewport=new j;scissor=new j;width=0;height=0;aoDivider=0;disposed=!1;dynamicRatio=1.5;frameEmaMs=16.7;cpuRenderEmaMs=0;aoCandidateScene=null;aoCandidates=[];aoProfile=``;constructor(e,t,n){this.renderer=e;let r=new Le(8,8,{type:F,depthBuffer:!0,stencilBuffer:!1});r.texture.name=`Aincrad HDR`,this.composer=new Gn(e,r),this.composer.setPixelRatio(1),this.composer.renderToScreen=!1,this.renderPass=new Kn(t,n),this.ao=new cr(t,n,8,8),this.ao.blendIntensity=.62,this.ao.updateGtaoMaterial({radius:2.4,thickness:1.5,distanceFallOff:1,samples:12,screenSpaceRadius:!1}),this.ao.updatePdMaterial({radius:4,samples:8,rings:2});let i=this.ao.render.bind(this.ao);this.ao.render=(...e)=>{let t=this.ao.scene;this.aoCandidateScene!==t&&(this.aoCandidateScene=t,this.aoCandidates=[],t.traverse(e=>{let t=e,n=t.material?Array.isArray(t.material)?t.material:[t.material]:[];(e instanceof l||n.some(e=>e.transparent||e.alphaTest>0||e instanceof s))&&this.aoCandidates.push(e)}));let n=[];this.aoCandidates.forEach(e=>{e.visible&&=(n.push(e),!1)});try{i(...e)}finally{n.forEach(e=>e.visible=!0)}},this.bloom=new Jn(new _(8,8),.16,.42,1.15),this.composer.addPass(this.renderPass),this.composer.addPass(this.ao),this.composer.addPass(this.bloom),this.composer.addPass(this.output),this.composer.addPass(this.fxaa)}snapshot(){return{targetScale:this.dynamicRatio,superSamplingRange:[1,1.5],frameEmaMs:this.frameEmaMs,cpuRenderEmaMs:this.cpuRenderEmaMs,antiAliasing:`FXAA + adaptive sharpen`,colorGrade:`cool shadows / warm highlights`}}invalidateAOCandidates(){this.aoCandidateScene=null}render(e,t,n,r,i=0,a=`high`){if(this.disposed)return;let o=performance.now(),s=this.renderer,c=t.userData.floatingCity===!0,l=t.userData.floatingAttraction===!0;c&&i>0?(this.frameEmaMs=k.lerp(this.frameEmaMs,Math.min(100,i*1e3),.08),a===`high`?(this.frameEmaMs>40?this.dynamicRatio=1:this.frameEmaMs>31.5?this.dynamicRatio=Math.max(1,this.dynamicRatio-.075):this.frameEmaMs<25&&(this.dynamicRatio=Math.min(l?1.25:1.5,this.dynamicRatio+.025)),l&&(this.dynamicRatio=Math.min(this.dynamicRatio,1.25))):this.dynamicRatio=1):c||(this.dynamicRatio=1.5);let u=Math.min(s.getPixelRatio(),a===`high`?c?this.dynamicRatio:1.5:1),d=Math.max(8,Math.ceil(n*u/8)*8),f=Math.max(8,Math.ceil(r*u/8)*8),p=c?this.dynamicRatio<=1.05?4:3:2;(d!==this.width||f!==this.height||p!==this.aoDivider)&&(this.width=d,this.height=f,this.aoDivider=p,this.composer.setSize(d,f),this.ao.setSize(Math.ceil(d/p),Math.ceil(f/p)),this.copyMaterial.uniforms.texelSize.value.set(1/d,1/f)),this.renderPass.scene=e,this.renderPass.camera=t,this.ao.camera=t,this.ao.scene=e,this.copyMaterial.uniforms.gradeContrast.value=c?1.14:1,this.copyMaterial.uniforms.gradeSaturation.value=c?1.24:1,this.copyMaterial.uniforms.gradeExposure.value=c?1.025:1,this.copyMaterial.uniforms.sharpness.value=c?.48:0,this.ao.enabled=a===`high`,this.ao.blendIntensity=a===`high`&&c?.82:.62;let m=t.name===`Aincrad cinematic camera`,h=m?12:c?3.35:2.4,g=m?5:c?2.15:1.5,_=`${a}:${m}:${c}`;this.aoProfile!==_&&(this.aoProfile=_,this.ao.updateGtaoMaterial({radius:h,thickness:g,samples:c?6:12}),this.ao.updatePdMaterial({samples:m?8:c?5:8})),this.bloom.enabled=a===`high`,this.bloom.strength=.16,this.bloom.radius=c?.5:.42,this.bloom.threshold=c?1.05:1.15,s.getViewport(this.viewport),s.getScissor(this.scissor);let v=s.getRenderTarget(),y=s.getScissorTest(),b=s.autoClear,x=s.toneMapping,S=s.toneMappingExposure;try{s.setScissorTest(!1),s.autoClear=!0,s.toneMapping=6,s.toneMappingExposure=c?.96:1.03,this.composer.render(i),s.setRenderTarget(v),s.setViewport(this.viewport),s.setScissor(this.scissor),s.setScissorTest(y),s.autoClear=!1,this.copyMaterial.uniforms.tDiffuse.value=this.composer.readBuffer.texture,this.copy.render(s)}finally{s.setRenderTarget(v),s.setViewport(this.viewport),s.setScissor(this.scissor),s.setScissorTest(y),s.autoClear=b,s.toneMapping=x,s.toneMappingExposure=S,this.cpuRenderEmaMs=k.lerp(this.cpuRenderEmaMs,performance.now()-o,this.cpuRenderEmaMs===0?1:.12)}}dispose(){this.disposed||(this.disposed=!0,this.bloom.dispose(),this.ao.dispose(),this.ao.gtaoMaterial.dispose(),this.ao.blendMaterial.dispose(),this.output.dispose(),this.fxaa.dispose(),this.composer.dispose(),this.copyMaterial.dispose(),this.copy.dispose())}};function ur(e){let t=[];e.traverse(e=>{e instanceof G&&!e.userData.floatingOutline&&e.name!==`player marker`&&t.push(e)});let n=new Set;for(let e of t){let t=Array.isArray(e.material)?e.material:[e.material];for(let e of t){if(n.has(e)||!(e instanceof I||e instanceof _e))continue;n.add(e);let t=e.onBeforeCompile,r=e.customProgramCacheKey.bind(e);e.onBeforeCompile=(e,n)=>{t(e,n),!e.fragmentShader.includes(`floatingHalfLambert`)&&(e.fragmentShader=e.fragmentShader.replace(`#include <lights_fragment_begin>`,`#include <lights_fragment_begin>
          #if NUM_DIR_LIGHTS > 0
            float floatingHalfLambert = clamp(dot(geometryNormal, normalize(directionalLights[0].direction)) * .5 + .5, 0., 1.);
            reflectedLight.directDiffuse *= .58 + floatingHalfLambert * .42;
          #endif`))},e.customProgramCacheKey=()=>`${r()}|floating-city-half-lambert-v1`,e.needsUpdate=!0}let r=e.parent;if(!r||!e.geometry.getAttribute(`position`))continue;let i=new W({color:1059634,side:1,transparent:!0,opacity:.88,depthWrite:!1,toneMapped:!1}),a=new G(e.geometry,i);a.name=`Floating City outline · ${e.name||`character`}`,a.position.copy(e.position),a.quaternion.copy(e.quaternion),a.scale.copy(e.scale),a.castShadow=!1,a.receiveShadow=!1,a.renderOrder=-1,a.userData.floatingOutline=!0,i.onBeforeCompile=e=>{e.vertexShader=e.vertexShader.replace(`#include <begin_vertex>`,`#include <begin_vertex>
        float floatingOutlineDistance = length((modelViewMatrix * vec4(transformed, 1.)).xyz);
        float floatingOutlineWidth = .014 + min(.012, floatingOutlineDistance * .000004);
        transformed += normalize(normal) * floatingOutlineWidth;`)},i.customProgramCacheKey=()=>`floating-city-character-outline-v1`,r.add(a)}e.userData.floatingCharacterLook={halfLambert:n.size,outlines:t.length}}var dr=[{name:`銀葉巡林者`,color:5005910,accent:12427632,hair:13154711,skin:13147779},{name:`緋暮旅人`,color:6768201,accent:11049343,hair:3549217,skin:12159345},{name:`霧峰斥候`,color:5399403,accent:10987674,hair:10194039,skin:14070425},{name:`苔谷守望者`,color:6841672,accent:11638630,hair:4076582,skin:10252631},{name:`月河尋路人`,color:5198699,accent:10726574,hair:11842730,skin:13080703},{name:`琥珀遊俠`,color:7954758,accent:12756852,hair:7159856,skin:11830372}];function fr(e,t=24){let n=[],r=[],i=[];e.forEach(([a,o,s,c=0],l)=>{for(let u=0;u<=t;u++){let d=u/t*Math.PI*2;if(n.push(Math.sin(d)*o,a,Math.cos(d)*s+c),r.push(u/t,l/(e.length-1)),l&&u){let e=l*(t+1)+u;i.push(e,e-1,e-t-2,e,e-t-2,e-t-1)}}});let s=new o;return s.setAttribute(`position`,new a(n,3)),s.setAttribute(`uv`,new a(r,2)),s.setIndex(i),s.computeVertexNormals(),s}function pr(e,t,n=6,r=12){return new S(new u(e.map(([e,t,n])=>new b(e,t,n))),r,t,n,!1)}function mr(e,t=!1){let n=t?[[.129,.914,-.042],[.335,1.008,-.031],[.193,.901,-.052],[.14,.885,-.05]]:[[.114,.936,.002],[.375,1.035,-.013],[.224,.886,-.003],[.138,.865,.006]],r=n.flatMap(([n,r,i])=>[n*e,r,i-(t?.002:.048)]);t||r.push(...n.flatMap(([t,n,r])=>[t*e,n,r+.018]));let i=new o,s=t?[0,1,2,0,2,3]:[0,1,2,0,2,3,6,5,4,7,6,4,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0];if(i.setAttribute(`position`,new a(r,3)),i.setAttribute(`uv`,new a(Array(r.length/3).fill([0,0]).flat(),2)),e<0)for(let e=0;e<s.length;e+=3)[s[e],s[e+2]]=[s[e+2],s[e]];return i.setIndex(s),i.computeVertexNormals(),i}function hr(){let e=new Uint8Array(16384);for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=(t*64+n)*4,i=(n*29+t*31+n*t*3)%13-6,a=205+(n%4<2?19:0)+(t%4<2?15:0)+i;e[r]=e[r+1]=e[r+2]=a,e[r+3]=255}let t=new x(e,64,64,he);return t.wrapS=t.wrapT=Ae,t.repeat.set(5,5),t.magFilter=t.minFilter=ne,t.needsUpdate=!0,t}function gr(e){e.updateMatrixWorld(!0);let t=e.matrixWorld.clone().invert(),n=new Map,r=new Set;e.traverse(e=>{if(!(e instanceof G)||Array.isArray(e.material))return;let i=e.geometry.index?e.geometry.toNonIndexed():e.geometry.clone();i.applyMatrix4(t.clone().multiply(e.matrixWorld));let a=n.get(e.material)??[];a.push(i),n.set(e.material,a),r.add(e.geometry)}),e.clear();for(let[t,r]of n){let n=pe(r);n&&R(e,n,t),r.forEach(e=>e.dispose())}r.forEach(e=>e.dispose())}var _r=class{id;root=new P;rig=new P;limbs=[];eyes=new P;marker;materials=[];opacity=1;skin;head=new P;elbows=[];knees=[];cloak;cloakBase;cloakFrame=0;targetRotation=new U;targetEuler=new A(0,0,0,`YXZ`);floatingMotion=null;constructor(e,t,n=e%10){this.id=e;let r=dr[(n%dr.length+dr.length)%dr.length];this.skin={name:r.name,color:r.color,accent:r.accent,type:`elf`},this.root.name=`castle-exclusive-elf`,this.root.userData.costume=r.name,this.root.userData.appearance=`elf`,this.root.add(this.rig);let i=hr(),o=(e,t=.8,n=0)=>new I({color:e,roughness:t,metalness:n}),s=new _e({color:r.skin,roughness:.62,metalness:0,sheen:.16,sheenColor:14990245,sheenRoughness:.85}),c=o(new T(r.skin).multiplyScalar(.8).getHex(),.74);c.side=2;let l=o(r.color,.93);l.map=i,l.bumpMap=i,l.bumpScale=.009;let u=o(4601643,.73);u.bumpMap=i,u.bumpScale=.004;let f=o(2959652,.83),p=o(r.accent,.41,.72),m=o(9601642,.9),h=o(r.hair,.72),g=o(new T(r.hair).lerp(new T(13219488),.23).getHex(),.69),_=o(4215626,.4),v=o(1120021,.3),y=o(12762026,.44),b=o(new T(r.skin).lerp(new T(7225401),.5).getHex(),.85),x=(e,t=20,n=12)=>new d(e,t,n),S=new P;this.rig.add(S),R(S,fr([[-.11,.14,.088],[-.025,.157,.105],[.15,.123,.093],[.37,.18,.116],[.49,.209,.105],[.55,.173,.08],[.6,.061,.058]]),l),R(S,fr([[.115,.133,.106],[.23,.14,.113],[.405,.19,.126],[.5,.195,.11]]),u),R(S,new V(.05,.059,.145,16),s,[0,.635,0]),R(S,fr([[.565,.075,.066],[.64,.063,.058]]),l);let C=R(S,new H(.069,.008,5,24),m,[0,.639,0]);C.rotation.x=Math.PI/2,C.scale.y=.86;for(let e=0;e<5;e++){let t=.27+e*.045;R(S,pr([[-.022,t,-.126],[.024,t+.032,-.13]],.0032,4,1),m),R(S,pr([[.022,t,-.126],[-.024,t+.032,-.13]],.0032,4,1),m)}let w=R(S,B(.048,.59,.025,.009),f,[-.01,.315,-.138]);w.rotation.z=-.47;let E=R(S,B(.067,.075,.031,.004),p,[-.042,.4,-.156]);E.rotation.z=-.47,R(S,B(.027,.04,.015,.003),f,[-.042,.4,-.178]).rotation.z=-.47,R(S,fr([[.065,.162,.116],[.135,.146,.116]]),f),R(S,B(.086,.066,.02,.006),p,[0,.1,-.125]),R(S,B(.057,.039,.025,.002),u,[0,.1,-.138]),R(S,B(.007,.047,.008,.002),p,[0,.1,-.154]);for(let e of[-1,1]){let t=R(S,B(.132,.28,.046,.015),l,[e*.081,-.083,-.086]);t.rotation.z=e*.11;let n=R(S,B(.007,.235,.012,.002),m,[e*.138,-.083,-.112]);n.rotation.z=e*.11,R(S,B(.13,.12,.08,.015),u,[e*.18,.07,0]),R(S,B(.115,.038,.084,.01),f,[e*.18,.105,-.003]),R(S,x(.011,8,6),p,[e*.18,.079,-.045]),R(S,x(.104),u,[e*.21,.495,.006],[1.08,.72,1.22]),R(S,x(.098),p,[e*.218,.515,.003],[1.08,.38,1.21]);for(let t of[-.082,.074])R(S,x(.008,8,6),p,[e*.236,.502,t]);R(S,x(.025,12,8),p,[e*.13,.515,-.105],[1,1,.35])}gr(S),this.rig.add(this.head);let D=new P;this.head.add(D,this.eyes),R(D,fr([[.698,.021,.032,-.019],[.724,.061,.071,-.006],[.765,.09,.096,.003],[.821,.117,.114,.003],[.887,.125,.121,.002],[.96,.119,.123,.006],[1.019,.09,.105,.016],[1.046,.014,.026,.018]],32),s);for(let e of[-1,1]){R(D,mr(e),s),R(D,mr(e,!0),c),R(D,x(.041,16,10),s,[e*.081,.834,-.085],[1,.52,.53]);let t=R(D,x(.039,16,10),s,[e*.054,.927,-.103],[1.2,.35,.35]);t.rotation.z=e*-.13,R(D,pr([[e*.023,.934,-.117],[e*.052,.941,-.119],[e*.087,.931,-.107]],.0043,5,6),h),R(D,pr([[e*.019,.907,-.12],[e*.052,.919,-.127],[e*.089,.906,-.107]],.0027,4,6),b),R(this.eyes,x(.036,16,10),y,[e*.053,.905,-.111],[1,.32,.4]),R(this.eyes,x(.011,12,8),_,[e*.049,.905,-.125],[.94,1,.31]),R(this.eyes,x(.005,10,6),v,[e*.049,.905,-.129],[.85,1,.38]),R(this.eyes,x(.0019,8,6),y,[e*.049-.002,.909,-.132])}R(D,x(.032,16,12),s,[0,.873,-.12],[.48,1.7,.72]),R(D,x(.021,16,10),s,[0,.838,-.145],[.7,.66,.89]);for(let e of[-1,1])R(D,x(.012,12,8),s,[e*.015,.832,-.134],[.8,.6,.8]);R(D,pr([[-.033,.788,-.092],[-.012,.791,-.107],[0,.787,-.109],[.012,.791,-.107],[.033,.788,-.092]],.003,5,10),b),R(D,x(.027,16,8),s,[0,.768,-.08],[1.05,.33,.35]),R(D,new d(1,28,16,0,Math.PI*2,0,Math.PI*.6),h,[0,.966,.021],[.136,.112,.137]),R(D,x(.125,20,12),h,[0,.938,.07],[.95,1.07,.67]);for(let e=0;e<14;e++){let t=e/13*Math.PI*1.45-Math.PI*.225,n=Math.sin(t),r=Math.cos(t);R(D,pr([[n*.035,1.071,.032+r*.022],[n*.109,1.035,.023+r*.094],[n*.136,.959,.023+r*.128]],.0034,4,8),g)}for(let e=0;e<7;e++){let t=e*.011;R(D,pr([[.086-t,1.054,-.035],[.022-t,1.065,-.106],[-.065-t*.72,1.015-t*.22,-.131],[-.11-t*.1,.953-t*.55,-.089]],.009-e*5e-4,6,12),e%3?h:g)}for(let e of[-1,1]){R(D,pr([[e*.118,.991,.011],[e*.141,.92,.024],[e*.145,.808,.043],[e*.105,.708,.066]],.021,7,12),h);for(let t=0;t<8;t++)R(D,x(.018,12,8),t%2?h:g,[e*(.13+Math.sin(t*2.3)*.012),.84-t*.024,.053],[.7,1,.8]);let t=R(D,new H(.013,.004,5,10),p,[e*.131,.666,.053]);t.rotation.x=Math.PI/2}gr(D),gr(this.eyes),this.eyes.children.forEach(e=>e.position.y-=.905),this.eyes.position.y=.905;for(let e of[-1,1]){let t=new P;t.position.set(e*.232,.482,0);let n=new P;R(n,new N(.065,.165,6,14),l,[0,-.108,0],[1,1,.94]),R(n,new V(.068,.064,.044,14),u,[0,-.155,0]),gr(n);let r=new P;r.position.y=-.245,R(r,new N(.051,.15,6,14),l,[0,-.095,0]),R(r,fr([[-.205,.044,.045],[-.17,.061,.052],[-.055,.054,.051]]),u),R(r,B(.056,.126,.024,.01),p,[0,-.12,-.049]);for(let e of[-.065,-.176])R(r,new V(.057,.056,.018,14),f,[0,e,0]);R(r,x(.043,14,10),s,[0,-.239,-.004],[.82,1.34,.59]),R(r,x(.016,10,8),s,[-e*.036,-.226,-.009],[.8,1.65,.85]),R(r,B(.059,.065,.024,.009),f,[0,-.223,.014]),gr(r),t.add(n,r),this.rig.add(t),this.limbs.push(t),this.elbows.push(r)}for(let e of[-1,1]){let t=new P;t.position.set(e*.086,-.02,0);let n=new P;R(n,new N(.074,.158,6,16),l,[0,-.134,0],[.94,1,1]),R(n,new V(.07,.063,.039,14),f,[0,-.177,0]),gr(n);let r=new P;r.position.y=-.29,R(r,new N(.051,.17,6,14),l,[0,-.137,0]),R(r,x(.059,14,10),u,[0,-.014,-.033],[.87,.86,.6]),R(r,fr([[-.353,.064,.066],[-.25,.059,.06],[-.16,.065,.067],[-.125,.061,.063]]),u),R(r,new V(.068,.067,.025,14),f,[0,-.137,0]),R(r,x(.071,18,10),u,[0,-.365,-.042],[.93,.66,1.61]),R(r,B(.143,.035,.235,.014),f,[0,-.419,-.047]),R(r,B(.116,.028,.06,.005),p,[0,-.269,-.062]);for(let e=0;e<4;e++)R(r,pr([[-.025,-.168-e*.035,-.064],[.025,-.191-e*.035,-.066]],.003,4,1),m);gr(r),t.add(n,r),this.rig.add(t),this.limbs.push(t),this.knees.push(r)}let O=new z(1,1,14,22),k=O.getAttribute(`position`),A=O.getAttribute(`uv`),j=[];for(let e=0;e<k.count;e++){let t=A.getX(e),n=1-A.getY(e);k.setXYZ(e,(t-.5)*(.365+n*.335),.555-n*1.02,.13+n*.16+Math.cos(t*Math.PI*10)*.015*n);let i=t<.075||t>.925||n>.956,a=new T(i?r.accent:16777215);i&&a.lerp(new T(16777215),.35),j.push(a.r,a.g,a.b)}O.setAttribute(`color`,new a(j,3)),O.computeVertexNormals(),this.cloakBase=new Float32Array(k.array);let M=l.clone();M.color.multiplyScalar(.66),M.side=2,M.vertexColors=!0,this.cloak=R(this.rig,O,M),this.cloak.name=`animated-woven-cloak`,t!==null&&(this.marker=R(this.root,new Te(.071,0),new I({color:t===0?13810813:9550528,emissive:t===0?8413233:3433582,emissiveIntensity:.4,roughness:.36,metalness:.6}),[0,1.42,0]),this.marker.castShadow=!1);let ee=new Set;this.root.traverse(e=>{if(e instanceof G)for(let t of Array.isArray(e.material)?e.material:[e.material])ee.add(t)}),this.materials=[...ee]}setOpacity(e){if(e=k.clamp(e,0,1),this.opacity!==e){this.opacity=e;for(let t of this.materials){let n=e<1;t.alphaHash!==n&&(t.alphaHash=n,t.needsUpdate=!0),t.opacity=e}}}setFloatingMotion(e){this.floatingMotion=e}animate(e,t,n,r,i){let a=e===`run`,o=e===`airborne`,s=e===`finished`,c=t*Math.max(n,1)*2.55,l=Math.sin(c),u=Math.min(1,n/4.5);if(this.rig.position.y=a?Math.abs(l)*.021*u:Math.sin(t*1.9+this.id)*.004,e!==`stumble`){this.targetEuler.set(e===`dive`?-Math.PI/2:a?-.067:0,r,a?l*.016:0,`YXZ`),this.targetRotation.setFromEuler(this.targetEuler),this.rig.quaternion.slerp(this.targetRotation,1-Math.exp(-Math.max(i,.001)*13));for(let n=0;n<2;n++){let r=n===0?-1:1,i=l*r;this.limbs[n].rotation.set(a?i*.67*u:s?2.48+Math.sin(t*4+n)*.12:o?.55:e===`dive`?2.75:.07,0,r*(o?.3:.105)),this.elbows[n].rotation.x=a?.42+Math.max(0,-i)*.3:s?.18:.16,this.limbs[n+2].rotation.x=a?-i*.66*u:o?n?.28:-.38:e===`dive`?-.12:0,this.knees[n].rotation.x=a?-Math.max(0,i)*.97*u:o?-.65:-.025}}this.head.rotation.y=Math.sin(t*.62+this.id)*(a?.015:.035),this.eyes.scale.y=Math.sin(t*1.15+this.id*.7)>.995?.08:1;let d=this.cloak.geometry.getAttribute(`position`),f=this.cloak.geometry.getAttribute(`uv`);for(let e=0;e<d.count;e++){let n=1-f.getY(e),r=f.getX(e),i=n*n;d.setXYZ(e,this.cloakBase[e*3]+Math.sin(t*2.6+n*3+this.id)*i*.022,this.cloakBase[e*3+1]+(a?.12*u:.01)*i,this.cloakBase[e*3+2]+i*((a?.14*u:.02)+Math.sin(t*(a?7:2.5)-n*5+r*4+this.id)*(a?.045:.018)))}if(d.needsUpdate=!0,++this.cloakFrame%3==0&&this.cloak.geometry.computeVertexNormals(),this.floatingMotion){let e=this.floatingMotion,t=e.launchSquash*.08-e.landingBounce*.05;this.rig.position.y+=e.groundOffset+e.landingBounce*.07,this.rig.scale.x*=1+t,this.rig.scale.z*=1+t,this.rig.scale.y*=1-t*1.25,this.rig.rotateZ(e.turnLean),this.cloak.rotation.y=e.accessoryLag*.75}else this.cloak.rotation.y=0;this.marker&&(this.marker.position.y=1.42+Math.sin(t*2)*.035,this.marker.rotation.y=t*.45)}},vr=class extends Ee{neighbors=[];rubberBandEnabled=!0;lane;constructor(e,t){let n=(e.id%3-1)*2.35,r=t.map((e,r)=>{if(r>=t.length-2)return e.clone();let i=r%96,a=i>=42&&i<=52?.24:1,o=t[r+1].clone().sub(e).normalize(),s=new b(0,1,0).cross(o).normalize();return e.clone().addScaledVector(s,n*a)});super(e,r),this.lane=n}setRubberBand(e){this.rubberBandEnabled=e}decide(t,n){let r=t>=this.nextReaction,i=super.decide(t,n),a=this.actor;if(r&&(this.nextReaction=t+.04+(1-a.skill)*.045),!a.active||a.machine.state===`respawn`)return i;if(!a.grounded){let t=a.world.castRay(new e.Ray(a.current,{x:0,y:-1,z:0}),2.5,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,e=>!(e.collisionGroups()>>>16&1));return{...i,jump:a.doubleJumpEnabled&&a.airJumpAvailable&&a.body.linvel().y<.2&&!t}}let o=Math.hypot(i.x,i.z);if(o<.01)return i;let s=i.x/o,c=i.z/o,l=e=>!(e.collisionGroups()>>>16&1),u=!1;for(let t of[.7,1.15]){let n=a.world.castRay(new e.Ray({x:a.current.x+s*t,y:a.current.y,z:a.current.z+c*t},{x:0,y:-1,z:0}),2.25,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,l);(!n||n.timeOfImpact<.4)&&(u=!0)}let d=a.world.castRay(new e.Ray({x:a.current.x,y:a.current.y-.1,z:a.current.z},{x:s,y:0,z:c}),3.5,!0,e.QueryFilterFlags.EXCLUDE_SENSORS,void 0,a.collider,a.body,e=>!!(e.collisionGroups()>>>16&4)),f=.93+a.skill*.07;for(let e of this.neighbors){if(e===a||!e.active||Math.abs(e.current.y-a.current.y)>1.5)continue;let t=e.current.x-a.current.x,n=e.current.z-a.current.z,r=t*s+n*c,i=t*c-n*s;r>.2&&r<2.2&&Math.abs(i)<.85&&!u&&(f*=.82)}d&&!u&&(f=d.timeOfImpact<1.7?0:.65);let p=this.neighbors.find(e=>e.player!==null&&e.active);if(this.rubberBandEnabled&&p){let e=k.clamp((p.progress-a.progress)/150,-1,1);f*=1+e*.08}return i={...i,x:i.x*f,z:i.z*f},{...i,jump:u||!d&&this.stuckTime>.8}}};export{vr as AincradBrain,In as AincradCinematic,lr as AincradPostProcessing,_r as ElfAppearance,dt as aincradMeadowHeight,ur as applyFloatingCharacterLook,kt as createAincradCourse,_t as createAincradWorld,On as createFloatingPark};