-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Dec 18, 2021 at 09:06 AM
-- Server version: 5.7.36-0ubuntu0.18.04.1
-- PHP Version: 7.4.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `books`
--

-- --------------------------------------------------------

--
-- Table structure for table `lot_orders`
--

CREATE TABLE `lot_orders` (
  `id` int(11) NOT NULL,
  `table_order_id` int(11) NOT NULL,
  `lot_id` int(11) NOT NULL,
  `price` decimal(12,4) NOT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--

-- --------------------------------------------------------

--
-- Table structure for table `table_orders`
--

CREATE TABLE `table_orders` (
  `id` int(11) NOT NULL,
  `place_id` smallint(2) NOT NULL,
  `table_number` smallint(2) NOT NULL,
  `date` date NOT NULL,
  `nft_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `table_orders`
--

--
-- Indexes for dumped tables
--

--
-- Indexes for table `lot_orders`
--
ALTER TABLE `lot_orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `table_orders`
--
ALTER TABLE `table_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_order` (`place_id`,`table_number`,`date`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `lot_orders`
--
ALTER TABLE `lot_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `table_orders`
--
ALTER TABLE `table_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
