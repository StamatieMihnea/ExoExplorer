# 🪐 Exoplanet Prediction Form - Field Guide for Beginners

This guide explains every field in the prediction form in simple terms. No astronomy background needed!

---

## 🌍 What is an Exoplanet?

An **exoplanet** is a planet that orbits a star outside our solar system (not around our Sun). Scientists find them by watching stars very carefully and looking for tiny changes.

---

## 📊 The Fields Explained

### **Orbital Period (koi_period)** 🔄
**What it is:** How long it takes the planet to go around its star once (like Earth takes 365 days to go around the Sun).

**In simple terms:** If this number is 10, the planet's "year" is 10 Earth days long. Small numbers mean the planet is very close to its star and orbits super fast!

**Example:** 289.86 means the planet takes about 290 days to orbit once.

---

### **Period Error (koi_period_err1, koi_period_err2)** 📏
**What it is:** How uncertain we are about the orbital period measurement.

**In simple terms:** Scientists can't measure things perfectly. These numbers show how confident we are. Smaller errors = better measurements = more certain we're right!

**Example:** ±0.0008 means we're pretty sure about the period.

---

### **Transit Epoch (koi_time0bk)** 📅
**What it is:** The exact time when we first saw the planet pass in front of its star.

**In simple terms:** Like recording the exact moment you saw something cool happen. This is measured in days from a specific starting date that astronomers use.

**Example:** 170.5 means it happened 170.5 days after the reference date.

---

### **Impact Parameter (koi_impact)** 🎯
**What it is:** How much the planet crosses the middle of the star when it passes in front.

**In simple terms:** Imagine throwing a ball at a target. If it hits dead center, the impact parameter is 0. If it barely grazes the edge, it's close to 1. Lower numbers = planet passes right through the middle = clearer signal!

**Example:** 0.425 means it passes somewhat off-center but still clearly visible.

---

### **Impact Parameter Error (koi_impact_err1, koi_impact_err2)** 📏
**What it is:** Uncertainty in the impact parameter measurement.

**In simple terms:** How confident we are about where exactly the planet crosses the star.

---

### **Transit Duration (koi_duration)** ⏱️
**What it is:** How long (in hours) the planet takes to pass in front of its star.

**In simple terms:** Like watching a car drive across your field of view. How many hours from when you first see it until it completely passes? Bigger planets or slower orbits take longer!

**Example:** 7.565 means the transit lasts about 7.5 hours.

---

### **Duration Error (koi_duration_err1, koi_duration_err2)** 📏
**What it is:** Uncertainty in the transit duration.

**In simple terms:** How confident we are about the exact timing.

---

### **Transit Depth (koi_depth)** 🕳️
**What it is:** How much dimmer the star gets when the planet passes in front (measured in parts per million, or ppm).

**In simple terms:** When the planet blocks some of the star's light, the star appears slightly dimmer. This number tells us by how much. Bigger planets block more light = bigger numbers!

**Example:** 980 ppm means the star gets 0.098% dimmer (barely noticeable to our eyes, but telescopes can detect it!).

---

### **Depth Error (koi_depth_err1, koi_depth_err2)** 📏
**What it is:** Uncertainty in the transit depth measurement.

**In simple terms:** How confident we are about the dimming amount.

---

### **Planetary Radius (koi_prad)** 🌕
**What it is:** How big the planet is compared to Earth (in Earth radii).

**In simple terms:** If this is 1.0, the planet is Earth-sized. If it's 2.0, it's twice as wide as Earth. If it's 10+, it's huge like Jupiter!

**Example:** 2.34 means this planet is about 2.3 times wider than Earth (a "super-Earth").

---

### **Planetary Radius Error (koi_prad_err1, koi_prad_err2)** 📏
**What it is:** Uncertainty in the planet size.

**In simple terms:** How confident we are about the planet's actual size.

---

### **Equilibrium Temperature (koi_teq)** 🌡️
**What it is:** The estimated temperature of the planet's surface (in Kelvin).

**In simple terms:** How hot or cold the planet is. Earth is about 288 K (15°C or 59°F). Higher numbers = hotter planet!

**Temperature guide:**
- **< 200 K** = Frozen (like Pluto)
- **250-300 K** = Just right (Earth-like, potentially habitable!)
- **400-600 K** = Hot (like Venus)
- **1000+ K** = Extremely hot (close to the star)

**Example:** 257 K is about -16°C (1°F) - cold but not freezing!

---

### **Insolation Flux (koi_insol)** ☀️
**What it is:** How much starlight the planet receives compared to Earth (in Earth flux).

**In simple terms:** How much "sunshine" the planet gets. Earth is 1.0. Higher = hotter and brighter. Lower = colder and dimmer.

**Example:** 1.03 means it gets about the same amount of light as Earth!

---

### **Insolation Flux Error (koi_insol_err1, koi_insol_err2)** 📏
**What it is:** Uncertainty in the insolation measurement.

---

### **Model Signal-to-Noise Ratio (koi_model_snr)** 📶
**What it is:** How clear the planet's signal is compared to background noise.

**In simple terms:** Like trying to hear someone talk in a noisy room. Higher numbers = clearer signal = we're more confident the planet is real!

**Signal strength guide:**
- **< 10** = Weak signal (might not be real)
- **10-50** = Decent signal (probably real)
- **50-100** = Strong signal (definitely real)
- **100+** = Extremely strong signal (no doubt!)

**Example:** 215.5 = Very clear, confident detection!

---

### **Stellar Effective Temperature (koi_steff)** ⭐
**What it is:** The surface temperature of the star (in Kelvin).

**In simple terms:** How hot the star is. Our Sun is about 5,778 K. Hotter stars are blue-white, cooler stars are red.

**Star types:**
- **< 4,000 K** = Red stars (cool, dim)
- **5,000-6,000 K** = Yellow stars (like our Sun)
- **> 7,000 K** = Blue-white stars (hot, bright)

**Example:** 5,550 K = Sun-like star!

---

### **Stellar Effective Temperature Error (koi_steff_err1, koi_steff_err2)** 📏
**What it is:** Uncertainty in the star's temperature.

---

### **Stellar Surface Gravity (koi_slogg)** 🏋️
**What it is:** The strength of gravity at the star's surface (in log10 cm/s²).

**In simple terms:** How strong the gravity is on the star's surface. Higher numbers = stronger gravity = denser star. Our Sun is about 4.44.

**Guide:**
- **< 4.0** = Giant star (big and puffy)
- **4.0-4.5** = Normal star (like the Sun)
- **> 4.5** = Dense star (compact)

**Example:** 4.442 = Very Sun-like!

---

### **Stellar Surface Gravity Error (koi_slogg_err1, koi_slogg_err2)** 📏
**What it is:** Uncertainty in the surface gravity.

---

### **Stellar Radius (koi_srad)** ⭐
**What it is:** How big the star is compared to our Sun (in solar radii).

**In simple terms:** If this is 1.0, the star is the same size as our Sun. Bigger numbers = bigger star!

**Example:** 0.925 means the star is slightly smaller than our Sun.

---

### **Stellar Radius Error (koi_srad_err1, koi_srad_err2)** 📏
**What it is:** Uncertainty in the star's radius.

---

### **Stellar Mass (koi_smass)** ⚖️
**What it is:** How heavy the star is compared to our Sun (in solar masses).

**In simple terms:** If this is 1.0, the star weighs the same as our Sun. More massive stars burn brighter and hotter!

**Example:** 0.985 means the star is slightly less massive than our Sun.

---

### **Stellar Mass Error (koi_smass_err1, koi_smass_err2)** 📏
**What it is:** Uncertainty in the star's mass.

---

### **Kepler Magnitude (koi_kepmag)** 💡
**What it is:** How bright the star appears to the Kepler telescope.

**In simple terms:** Lower numbers = brighter stars. Our Sun would be about 4.8 if viewed from where Kepler is. Most stars Kepler studied are 10-16 (fainter, farther away).

**Example:** 11.664 = Fairly bright star (easy to observe).

---

### **KOI Count (koi_count)** 🔢
**What it is:** How many planet candidates orbit this star.

**In simple terms:** Some stars have multiple planets! This tells us how many possible planets were found around this star.

**Example:** 1 = This is the only planet candidate around this star.

---

### **Number of Transits (koi_num_transits)** 🔄
**What it is:** How many times we saw the planet pass in front of its star.

**In simple terms:** The more times we see it, the more confident we are it's real! More observations = better data = more trustworthy!

**Guide:**
- **< 10** = Few observations (less confident)
- **10-50** = Good observations
- **50-100** = Great observations
- **100+** = Excellent observations!

**Example:** 145 = Very well observed!

---

### **Maximum Multiple Event (koi_max_mult_ev)** 📊
**What it is:** Statistical measure of how significant the combined signal is across all transits.

**In simple terms:** When scientists combine all the transit observations, this number shows how clear the overall pattern is. Higher = more confident!

---

### **Maximum Single Event (koi_max_sngle_ev)** 📊
**What it is:** Statistical measure of the strongest single transit detection.

**In simple terms:** Of all the transits we saw, this is how clear the best one was. Higher = stronger individual detection!

---

### **Planet-to-Star Radius Ratio (koi_ror)** 📐
**What it is:** How big the planet is compared to its star (as a ratio).

**In simple terms:** If the planet's radius is 1% of the star's radius, this would be 0.01. Helps us calculate the planet's actual size!

**Example:** 0.0312 means the planet is about 3.12% the size of its star.

---

### **Radius Ratio Error (koi_ror_err1, koi_ror_err2)** 📏
**What it is:** Uncertainty in the radius ratio.

---

### **Stellar Density (koi_srho)** 🎱
**What it is:** How tightly packed the star's material is (from transit fitting).

**In simple terms:** Denser stars have their material packed more tightly. This helps us understand what type of star it is!

---

### **Stellar Density Error (koi_srho_err1, koi_srho_err2)** 📏
**What it is:** Uncertainty in the stellar density.

---

### **Distance Over Stellar Radius (koi_dor)** 📏
**What it is:** The planet's orbital distance divided by the star's radius.

**In simple terms:** This tells us how far the planet orbits compared to the star's size. Helps scientists understand the orbital geometry!

---

### **Distance Over Stellar Radius Error (koi_dor_err1, koi_dor_err2)** 📏
**What it is:** Uncertainty in this distance ratio.

---

### **Semi-Major Axis (koi_sma)** 🛰️
**What it is:** The average distance between the planet and its star (in AU - Astronomical Units).

**In simple terms:** How far the planet is from its star. 1 AU = Earth's distance from the Sun (93 million miles).

**Distance guide:**
- **< 0.1 AU** = Very close (hot planets)
- **0.5-1.5 AU** = Habitable zone (just right!)
- **> 5 AU** = Far away (cold planets)

**Example:** 0.849 AU = Slightly closer than Earth to its star.

---

### **Orbital Inclination (koi_incl)** 📐
**What it is:** The tilt of the planet's orbit (in degrees).

**In simple terms:** If the planet crosses exactly through the middle of the star from our view, this is 90°. Perfect alignment = 90°!

**Guide:**
- **89-90°** = Perfect alignment (we see clear transits!)
- **85-89°** = Slightly tilted (still see transits)
- **< 85°** = Very tilted (transits might not be visible)

**Example:** 89.45° = Nearly perfect edge-on view!

---

### **Binary Odd-Even Depth Significance (koi_bin_oedp_sig)** 🔍
**What it is:** Tests if odd-numbered and even-numbered transits have the same depth.

**In simple terms:** Real planets should block the same amount of light every time. This checks if the pattern is consistent. Higher = more consistent = more likely a real planet!

---

### **Right Ascension (ra)** 🧭
**What it is:** The star's position in the sky (like longitude on Earth, but for space).

**In simple terms:** This is like a GPS coordinate for finding the star in the sky.

---

### **Declination (dec)** 🧭
**What it is:** The star's position in the sky (like latitude on Earth, but for space).

**In simple terms:** Together with Right Ascension, this tells us exactly where to point a telescope to find the star.

---

## 🎯 What Makes a Good Exoplanet Candidate?

A planet is more likely to be REAL (a CANDIDATE) if:

✅ **High SNR** (>50) - Clear, strong signal  
✅ **Many transits** (>50) - Observed multiple times  
✅ **Small error bars** - Precise measurements  
✅ **Low impact parameter** (<0.5) - Crosses through the star's center  
✅ **Consistent transit depths** - Blocks same amount of light each time  
✅ **Makes physical sense** - Temperature, size, and orbit all match up  

---

## 🚫 What Makes a False Positive?

Something might NOT be a real planet if:

❌ Low SNR (<10) - Weak, noisy signal  
❌ Few observations (<10) - Not enough data  
❌ Large error bars - Uncertain measurements  
❌ Inconsistent transits - Depth changes between observations  
❌ Doesn't make sense physically - Weird combinations of properties  

---

## 💡 Quick Tips

1. **Don't worry about filling every field!** The model can handle missing data.
2. **Smaller error bars = better data** - Scientists love precise measurements!
3. **The SNR is super important** - It's like the "confidence score" of the detection.
4. **More transits = more trustworthy** - Seeing something once could be a fluke, but 100+ times? That's real!

---

## 🌟 Fun Facts

- **Kepler Space Telescope** found over 2,600 confirmed exoplanets by staring at 150,000 stars for years!
- Some exoplanets are **hotter than our Sun** (>5,000 K)!
- The **habitable zone** (where water could be liquid) depends on how hot the star is.
- Scientists can detect planets **thousands of light-years away** just by measuring tiny dips in starlight!

---

**Now you're ready to predict exoplanets like a pro!** 🚀🪐

Fill in the form with your data, hit predict, and see if you've found a new world!

