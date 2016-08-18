
# THESE PACKAGES ARE REQUIRED
packages <- c("yaml", "dplyr", "tidyr", "lubridate",
              "readr", "ggplot2")

loaded <- all(sapply(packages, require, character.only = TRUE))

if (!loaded) {
  stop("ERROR: Missing some packages, try running 'install.packages(packages)`")
}

theme_set(theme_bw())
theme_update(strip.background = element_blank(),
             strip.text = element_text(face = "bold"))

