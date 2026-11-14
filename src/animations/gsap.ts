"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, Flip, SplitText);

export { gsap, useGSAP, Flip, SplitText };
