import { Scanner } from "./scan.mjs";

const lex = (code) => {
  const scanner = new Scanner(code);
  const tokens = scanner.scanTokens();
  return tokens;
};

const code = `
/ {
	keymap {
		compatible = "zmk,keymap";
		default_layer {
				// ------------------------------------------------------------------------------------------
				// |  \`  |  1  |  2  |  3  |  4  |  5  |  6  |  7  |  8  |  9  |  0  |  -  |  =  |   BKSP
				// ------------------------------------------------------------------------------------------
			bindings = <
				&kp ESC &kp N1
			>;
			sensor-bindings = <&inc_dec_kp C_VOL_UP C_VOL_DN>;
		};
	};
};
`;

const fullcode = `
#include <behaviors.dtsi>
#include <dt-bindings/zmk/keys.h>
#include <dt-bindings/zmk/bt.h>
#include <dt-bindings/zmk/rgb.h>
#include <dt-bindings/zmk/backlight.h>

/ {
	keymap {
		compatible = "zmk,keymap";

		default_layer {
				// ------------------------------------------------------------------------------------------
				// |  \`  |  1  |  2  |  3  |  4  |  5  |  6  |  7  |  8  |  9  |  0  |  -  |  =  |   BKSP
				// | TAB  |  Q  |  W  |  E  |  R  |  T  |  Y  |  U  |  I  |  O  |  P  |  [  |  ]  |        |
				// | CAPS  |  A  |  S  |  D  |  F  |  G  |  H  |  J  |  K  |  L  |  ;  |  '  |  #  | ENTER |
				// |  SHIFT|  \ |  Z  |  X  |  C  |  V  |  B  |  N  |  M  |  ,  |  .  | /   |    SHIFT    |
				// |  CTL  |  WIN  |  ALT  |            SPACE               | ALT | 1    |  MENU    |  CTRL|
				// ------------------------------------------------------------------------------------------
			bindings = <

				&kp ESC &kp N1 &kp N2 &kp N3 &kp N4 &kp N5 &kp N6 &kp N7 &kp  N8   &kp  N9 &kp  N0  &kp MINUS &kp EQUAL &kp BSPC
				&kp TAB  &kp Q  &kp W  &kp E  &kp R  &kp T  &kp Y  &kp U  &kp  I    &kp  O  &kp  P   &kp LBKT &kp RBKT
				&kp CAPS  &kp A  &kp S  &kp D  &kp F  &kp G  &kp H  &kp J  &kp  K    &kp  L  &kp SEMI &kp SQT &kp NON_US_HASH  &kp RET
				&kp LSHFT &kp NON_US_BSLH &kp Z  &kp X  &kp C  &kp V  &kp B  &kp N  &kp M  &kp COMMA &kp DOT &kp FSLH         &kp RSHFT
				&kp LCTRL &kp LGUI &kp LALT            &kp SPACE                          &kp RALT  &mo 1 &kp C_MENU    &kp RCTRL
			>;
			sensor-bindings = <&inc_dec_kp C_VOL_UP C_VOL_DN>;
		};
		raise {
			bindings = <
				&bt BT_CLR &kp F1 &kp F2 &kp F3 &kp F4 &kp F5 &kp F6 &kp F7 &kp F8 &kp F9 &kp F10 &kp F11 &kp F12 &kp DEL
				&trans &trans &kp UP &trans &trans &trans &trans &trans &kp INS &trans &kp PSCRN &kp SLCK &kp PAUSE_BREAK
				&kp CAPS    &kp LEFT &kp DOWN &kp RIGHT &trans &trans &trans &trans &trans &trans &kp HOME  &kp PG_UP &trans  &bootloader
				&kp C_PREV &kp C_VOL_DN &kp C_VOL_UP &kp C_MUTE &bl BL_INC &bl BL_DEC &trans &trans &trans &rgb_ug RGB_TOG &kp END &kp PG_DN  &bl BL_TOG
				&bt BT_PRV &bt BT_NXT  &trans              &trans                            &trans   &trans   &reset &bt BT_CLR
			>;
			sensor-bindings = <&inc_dec_kp C_VOL_UP C_VOL_DN>;
		};
	};
};
`;

const result = lex(fullcode);
console.log("result is", result);
