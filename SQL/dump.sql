-- MySQL dump 10.18  Distrib 10.3.27-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: bsfr
-- ------------------------------------------------------
-- Server version	10.3.27-MariaDB-0+deb10u1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ban`
--

DROP TABLE IF EXISTS `ban`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ban` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vilain_id` varchar(255) NOT NULL,
  `ask_id` varchar(255) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `unban_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ban`
--

LOCK TABLES `ban` WRITE;
/*!40000 ALTER TABLE `ban` DISABLE KEYS */;
INSERT INTO `ban` VALUES (5,'422450944652083212','220151545486901248','attention','2121-05-07 15:48:17');
/*!40000 ALTER TABLE `ban` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `birthday`
--

DROP TABLE IF EXISTS `birthday`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `birthday` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `discord_id` text NOT NULL,
  `date` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `birthday`
--

LOCK TABLES `birthday` WRITE;
/*!40000 ALTER TABLE `birthday` DISABLE KEYS */;
INSERT INTO `birthday` VALUES (4,'220151545486901248','2000-06-11'),(5,'348917611150704641','2003-12-07'),(6,'324633828616568833','2001-03-06'),(7,'366986717137469450','2005-09-18'),(9,'517320770196865024','2005-10-07'),(10,'481533074249875486','1994-05-13'),(11,'155390618368081921','1998-05-20'),(12,'577574927893266433','1999-08-22'),(13,'216497947221819392','1998-06-29'),(14,'183587654602981376','1995-11-02'),(15,'191608801164656640','2001-02-06'),(16,'275335326740774922','2003-12-18'),(17,'813148138453073991','2005-03-16'),(18,'430285530714996736','2005-09-03'),(19,'348464808154103808','1997-05-19'),(20,'470470104467898378','2004-03-29'),(22,'190868252040232960','1997-08-17'),(24,'186156892379283456','2002-01-03'),(25,'525714158998781954','2006-12-10'),(27,'140902175093161984','1997-10-10'),(28,'119467937928052748','1993-01-15'),(29,'619805509221875734','2004-04-19'),(30,'240495537848057856','2000-02-06'),(31,'265558001837015040','2002-08-22'),(32,'174972581961662464','2001-03-17'),(33,'381697989787516928','2002-02-12'),(34,'240897656577196032','1994-10-25'),(35,'417404448034258944','2005-11-17'),(36,'323871617216282624','2001-01-13'),(37,'225998549828108288','1989-03-28'),(38,'313251785412182028','2005-08-01'),(39,'96964347082846208','1970-01-01'),(40,'504319097618694155','2004-10-12'),(41,'392568767638667265','2004-06-02'),(42,'137290840975343616','1997-12-10'),(43,'408655646502682650','2004-05-28'),(44,'269958770098962443','2000-04-14'),(45,'284720377605783552','2001-11-09'),(46,'151388569615728641','2004-01-07'),(47,'347459374689812483','1999-10-26'),(48,'292603884520734720','1999-04-14'),(49,'477918282880385043','2003-08-31'),(51,'562637909593686047','2007-11-02'),(52,'667841315660234764','2007-07-21'),(55,'220754350736277504','1987-04-25'),(56,'257377536135135233','2008-07-01'),(57,'269155273581527041','2002-12-01'),(58,'262561175055630337','2003-09-24'),(59,'359383135990841345','1999-11-20'),(60,'628269253807570955','2003-03-20'),(61,'377147303724580865','2000-09-28'),(63,'216874228174028800','2002-05-02'),(64,'141916320257146880','2002-12-16'),(65,'145556654241349632','2000-08-02'),(66,'231732554737254400','1998-08-06'),(67,'149636916566818816','2002-12-22'),(68,'226791878140493824','2001-12-25'),(69,'697932270941765684','1994-01-19'),(72,'476676329518006282','2005-11-30'),(73,'220181789614931969','2000-08-31'),(74,'341060560227401731','1998-09-18'),(75,'381475462628507648','2006-05-28'),(76,'240604204555698178','1992-10-05'),(77,'228202771793313802','2001-02-04'),(78,'769961282349826049','2002-03-28'),(79,'331071018485415939','2005-01-27'),(80,'280847177163603971','2004-03-23'),(81,'308329720876105728','1993-11-19'),(82,'515413416429748235','2005-04-09'),(83,'236957792559169536','2000-11-22'),(84,'345508162310504448','2007-01-29'),(85,'244922991618555904','1987-02-07'),(86,'463053641386033154','2005-03-30'),(87,'244468949889187840','2005-09-21'),(88,'249557620103446528','2001-09-04'),(90,'730012687207104583','2006-11-05'),(91,'575485569342373898','1972-05-10'),(93,'177129013200814080','2001-03-07'),(94,'222771755897323540','1999-12-27'),(95,'545332827667824650','2002-08-16'),(96,'207847880294137856','2003-10-13'),(97,'194483829350727681','1999-12-11'),(98,'606880293470732289','2005-03-08'),(99,'386499139057483776','2004-08-17'),(100,'593821632687243305','2007-05-11'),(101,'684727610613301309','2006-08-21'),(102,'411173738403463168','2001-07-26'),(103,'216593344644513792','2003-12-20'),(104,'167346622223613953','2002-03-25'),(105,'267048991592546304','1992-12-09'),(106,'223941228050251776','2003-01-31'),(107,'360451350083141644','2004-07-25'),(108,'331814007038148609','2002-10-27'),(109,'558970321747705857','1989-09-09'),(110,'693880777061957723','1989-07-21'),(111,'705156508337438810','2009-08-09'),(112,'511958817957740564','2008-06-25'),(113,'674347509593800767','2007-03-27'),(114,'216986088210825217','2000-01-14'),(115,'275369612282167298','2002-04-26'),(116,'571373910470164492','2006-07-22'),(117,'379169192391344133','2005-05-07'),(118,'99182552979365888','1996-09-06'),(119,'81078612605804544','1996-09-13'),(120,'691257629753868318','2008-07-13'),(121,'307971778137948160','2000-12-11'),(122,'384362159653519387','2004-07-13');
/*!40000 ALTER TABLE `birthday` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `file_infected_history`
--

DROP TABLE IF EXISTS `file_infected_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `file_infected_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `author_id` varchar(255) NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `filename` varchar(255) NOT NULL,
  `scan_result` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file_infected_history`
--

LOCK TABLES `file_infected_history` WRITE;
/*!40000 ALTER TABLE `file_infected_history` DISABLE KEYS */;
INSERT INTO `file_infected_history` VALUES (1,'301471381563113473','2021-03-16 23:19:22','ChilledWindows.exe','/home/adminbsfr/scan/ChilledWindows.exe: Win.Packed.Badjoke-9775832-0 FOUND\n\n----------- SCAN SUMMARY -----------\nKnown viruses: 8510119\nEngine version: 0.102.4\nScanned directories: 0\nScanned files: 1\nInfected files: 1\nData scanned: 4.65 MB\nData read: 4.36 MB (ratio 1.07:1)\nTime: 17.809 sec (0 m 17 s)'),(2,'301471381563113473','2021-03-16 23:34:57','hg_1920x1080.exe','/home/adminbsfr/scan/hg_1920x1080.exe: Win.Packed.kkrunchy-7049457-1 FOUND\n\n----------- SCAN SUMMARY -----------\nKnown viruses: 8510119\nEngine version: 0.102.4\nScanned directories: 0\nScanned files: 1\nInfected files: 1\nData scanned: 0.06 MB\nData read: 0.06 MB (ratio 1.00:1)\nTime: 16.750 sec (0 m 16 s)'),(3,'301471381563113473','2021-03-17 08:41:47','fr-041_debris.exe','/home/adminbsfr/scan/fr-041_debris.exe: Win.Packed.kkrunchy-7049457-1 FOUND\n\n----------- SCAN SUMMARY -----------\nKnown viruses: 8510119\nEngine version: 0.102.4\nScanned directories: 0\nScanned files: 1\nInfected files: 1\nData scanned: 0.12 MB\nData read: 0.17 MB (ratio 0.73:1)\nTime: 16.785 sec (0 m 16 s)');
/*!40000 ALTER TABLE `file_infected_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pending_ban`
--

DROP TABLE IF EXISTS `pending_ban`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pending_ban` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message_id` varchar(255) NOT NULL,
  `vilain_id` varchar(255) NOT NULL,
  `ask_id` varchar(255) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `unban_date` datetime DEFAULT NULL,
  `ping_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pending_ban`
--

LOCK TABLES `pending_ban` WRITE;
/*!40000 ALTER TABLE `pending_ban` DISABLE KEYS */;
/*!40000 ALTER TABLE `pending_ban` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stats`
--

DROP TABLE IF EXISTS `stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `action` varchar(255) NOT NULL,
  `counter` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stats`
--

LOCK TABLES `stats` WRITE;
/*!40000 ALTER TABLE `stats` DISABLE KEYS */;
/*!40000 ALTER TABLE `stats` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-08-12 21:32:22