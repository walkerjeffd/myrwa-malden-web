# Load water quality data and stations from Access database
# Save results to csv files in data/db/

source("packages.R")

# devtools::install_github("walkerjeffd/myrwaR")
library(myrwaR)

cfg <- yaml.load_file("config.yaml")


# load data ---------------------------------------------------------------

wq <- load_wq(path = cfg$db, sample_types = NULL, exclude_flags = FALSE)
# wq <- read_csv("db/db_wq_malden.csv")

ch <- db_connect(cfg$db)
stn <- db_table(ch, "Location") %>%
  rename(LocationID = ID)
close(ch)
# stn <- read_csv("db/db_stn_malden.csv")

wq_malden <- wq %>%
  filter(ProjectID %in% c("BASE"),
         LocationID %in% c("MAR036"),
         SampleTypeID == "S",
         CharacteristicID == "ECOLI") %>%
  droplevels %>%
  select(id=ID, site=LocationID, visit=VisitID, param=CharacteristicID,
         datetime=Datetime, value=ResultValue, units=Units) %>%
  arrange(datetime)

stn_malden <- stn %>%
  filter(LocationID %in% as.character(unique(wq_malden$site))) %>%
  droplevels %>%
  select(site = LocationID, description = LocationDescription,
         latitude = Latitude, longitude = Longitude) %>%
  mutate(organization = plyr::revalue(site, c("MAR036"="MyRWA")))


# load precip -------------------------------------------------------------

prcp <- load_precip_from_xls(cfg$precip)
prcp$Precip48 <- antecedent_precip(prcp, period = 48)

prcp %>%
  mutate(Datetime = format(Datetime, "%Y-%m-%d %H:%M"))

names(prcp) <- tolower(names(prcp))

# merge -------------------------------------------------------------------

wq_malden_prcp <- wq_malden %>%
  mutate(datehour = round_date(datetime, "hour")) %>%
  left_join(prcp, by = c("datehour" = "datetime"))

# export ------------------------------------------------------------------

wq_malden_prcp %>%
  select(-datehour) %>%
  write_csv(path = "../public/data/wq.csv", na = "null")

stn_malden %>%
  write_csv(path = "../public/data/stn.csv")

prcp %>%
  write_csv(path = "../public/data/prcp.csv", na = "null")
