<?php
/*
 * Copyright 2005-2014 MERETHIS
 * Centreon is developped by : Julien Mathis and Romain Le Merlus under
 * GPL Licence 2.0.
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation ; either version 2 of the License.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, see <http://www.gnu.org/licenses>.
 *
 * Linking this program statically or dynamically with other modules is making a
 * combined work based on this program. Thus, the terms and conditions of the GNU
 * General Public License cover the whole combination.
 *
 * As a special exception, the copyright holders of this program give MERETHIS
 * permission to link this program with independent modules to produce an executable,
 * regardless of the license terms of these independent modules, and to copy and
 * distribute the resulting executable under terms of MERETHIS choice, provided that
 * MERETHIS also meet, for each linked independent module, the terms  and conditions
 * of the license of that module. An independent module is a module which is not
 * derived from this program. If you modify this program, you may extend this
 * exception to your version of the program, but you are not obliged to do so. If you
 * do not wish to do so, delete this exception statement from your version.
 *
 * For more information : contact@centreon.com
 *
 */

namespace  CentreonConfiguration\Repository;

use Centreon\Internal\Di;
use Centreon\Internal\Exception;

/**
 * Factory for ConfigGenerate Engine
 *
 * @author Julien Mathis <jmathis@merethis.com>
 * @version 3.0.0
 */

abstract class ConfigRepositoryAbstract
{
    /**
     *
     * @var type
     */
    protected $di;

    /**
     *
     * @var array
     */
    protected $output;
    
    /**
     *
     * @var int
     */
    protected $pollerId;

    /**
     *
     * @var bool
     */
    protected $status;

    /**
     * Method tests
     * 
     * @param int $pollerId
     * @return type
     */
    public function __construct($pollerId)
    {
        $this->di = Di::getDefault();
        $this->output = array();
        $this->pollerId = $pollerId;
        $this->status = true;
    }

    /**
     * Get output
     *
     * @param string $glue
     * @return string
     */
    public function getOutput($glue = "\n")
    {
        return $glue . implode($glue, $this->output) . $glue;
    }

    /**
     * Get status
     *
     * @return int 1 = successful, 0 = error occured
     */
    public function getStatus()
    {
        if ($this->status) {
            return 1;
        }
        return 0;
    }
}
