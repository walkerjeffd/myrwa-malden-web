# Daily Precipitation Dataset

source("packages.R")

library(myrwaR)

cfg <- yaml.load_file("config.yaml")

prcp <- load_precip_from_xls(cfg$precip)
prcp$Precip48 <- antecedent_precip(prcp, period = 48)

prcp %>%
  mutate(Datetime = format(Datetime, "%Y-%m-%d %H:%M")) %>%
  write_csv("data/db/db_precip.csv")