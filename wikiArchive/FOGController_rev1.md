## Overview

FOGController is a new Chainable PHP Class developed for use in FOG web
applications. This Class acts as an abstraction layer between PHP\'s
data and its database entry.

The Class is an abstract Class, providing a base for FOG Classes to
build from. All you need to do is describe to the Class the relationship
between your Database fields and common names used when accessing the
data.

-   Please note all of this is developmental and could change at any
    moment

## Variables & Methods {#variables_methods}

**Variables and their defaults**

    abstract class FOGController
    {
        // Table
        protected $databaseTable = '';

        // Name -> Database field name
        protected $databaseFields = array();

        // Do not update these database fields
        protected $databaseFieldsToIgnore = array(
            'createdBy',
            'createdTime'
        );

        // Allow setting / getting of these additional fields
        protected $additionalFields = array();

        // Required database fields
        protected $databaseFieldsRequired = array(
            'id',
            'name'
        );

        // Store data array
        protected $data = array();

        // Auto save class data on __destruct
        protected $autoSave = false;

        // DEBUG mode - print all Errors & SQL queries
        protected $debug = false;
    }

**Methods**

    $this   public function __construct($data)
    $this   public function __destruct()
    $this   public function set($key, $value)
    $this   public function get($key)
    $this   public function add($key, $value)
    $this   public function remove($key, $object)
    boolean public function save()
    boolean public function load($field = 'id')
    boolean public function destroy($field = 'id')
    void    public function error($txt, $data = array())
    void    public function info($txt, $data = array())
    boolean public function isValid()
    boolean private function isTableDefined()
    string  public function __toString()

## Example

This is an example of FOG\'s up coming OS Class in v0.33

**OS.class.php**

    class OS extends FOGController
    {
        // Table
        protected $databaseTable = 'os';
        
        // Name -> Database field name
        protected $databaseFields = array(
            'id'        => 'osID',
            'name'      => 'osName',
            'description'   => 'osDescription'
        );
    }

Only \$databaseFields is required.

Providing \$databaseTable gives access to FOGControllers save() and
load() functions.

**Example: Add new OS**

    // New OS Object
    $OS = new OS();

    // Set name -> Set description -> Save to database (returns true on success)
    if ($OS->set('name', 'Windows 8')->set('description', 'more junk')->save())
    {
        // id property is added after a successful save
        $FOGCore->setMessage(sprintf('OS Added: ID: %s, Name: %s', $OS->get('id'), $OS->get('name')));
    }
    else
    {
        $FOGCore->setMessage(sprintf('Failed to add: %s', $OS->get('name')));
    }

    // Redirect back to self
    $FOGCore->redirect();

**Example: Update an Existing OS**

    // OS ID Variable
    $id = '1';
    // Load OS - auto loads from database when ID is passed
    $OS = new OS($id);

    // Is OS valid? (was it loaded from the database correctly)
    if ($OS->isValid())
    {
        print_r($OS);
    }

## Class

**FOGController.class.php**

    <?php

    // Blackout - 1:28 PM 23/09/2011
    abstract class FOGController
    {
        // Table
        protected $databaseTable = '';
        
        // Name -> Database field name
        protected $databaseFields = array();
        
        // Do not update these database fields
        protected $databaseFieldsToIgnore = array(
            'createdBy',
            'createdTime'
        );
        
        // Allow setting / getting of these additional fields
        protected $additionalFields = array();
        
        // Required database fields
        protected $databaseFieldsRequired = array(
            'id',
            'name'
        );
        
        // Store data array
        protected $data = array();
        
        // Auto save class data on __destruct
        protected $autoSave = false;
        
        // DEBUG mode - print all Errors & SQL queries
        protected $debug = true;    
        
        // Database Class
        protected $db;
        
        // Construct
        public function __construct($data)
        {
            try
            {
                // Error checking
                if (!count($this->databaseFields))
                {
                    throw new Exception('No database fields defined for this class!');
                }
                
                // Database
                $this->db = $GLOBALS['db'];
                
                // Add incoming data
                if (is_array($data))
                {
                    // Iterate data -> Set data
                    foreach ($data AS $key => $value)
                    {
                        $this->set($key, $value);
                    }
                }
                // If incoming data is an INT -> Set as ID -> Load from database
                elseif (is_numeric($data))
                {
                    if ($data <= 0)
                    {
                        throw new Exception(sprintf('ID less than or equal to 0: Data: %s', $data));
                        //return false;
                    }
                    
                    $this->set('id', $data)->load();
                }
                // Unknown data format
                else
                {
                    throw new Exception('No data array or ID passed!');
                }
            }
            catch (Exception $e)
            {
                $this->error('Create Class Failed: Class: %s, Error: %s', array(get_class($this), $e->getMessage()));
            }
            
            return $this;
        }
        
        // Destruct
        public function __destruct()
        {
            // Auto save
            if ($this->autoSave)
            {
                $this->save();
            }
        }
        
        // Set
        public function set($key, $value)
        {
            try
            {
                $databaseFieldsRev = array_flip($this->databaseFields);
                
                if (!array_key_exists($key, $this->databaseFields) && !in_array($key, $this->additionalFields) && !array_key_exists($key, $databaseFieldsRev))
                {
                    throw new Exception('Invalid data being set');
                }
                
                if (array_key_exists($key, $databaseFieldsRev))
                {
                    $key = $databaseFieldsRev[$key];
                }
                
                $this->data[$key] = $value;
            }
            catch (Exception $e)
            {
                $this->error('Set Failed: Class: %s, Key: %s, Value: %s, Error: %s', array(get_class($this), $key, $value, $e->getMessage()));
            }
            
            return $this;
        }
        
        // Get
        public function get($key)
        {
            return (isset($this->data[$key]) ? $this->data[$key] : '');
        }
        
        /*
        public function __set($key, $value)
        {
            return $this->set($key, $value);
        }
        
        public function __get($key)
        {
            return $this->get($key);
        }
        */
        
        // Add
        public function add($key, $value)
        {
            try
            {
                $databaseFieldsRev = array_flip($this->databaseFields);
                
                if (!array_key_exists($key, $this->databaseFields) && !in_array($key, $this->additionalFields) && !array_key_exists($key, $databaseFieldsRev))
                {
                    throw new Exception('Invalid data being set');
                }
                
                if (array_key_exists($key, $databaseFieldsRev))
                {
                    $key = $databaseFieldsRev[$key];
                }
                
                $this->data[$key][] = $value;
            }
            catch (Exception $e)
            {
                $this->error('Add Failed: Class: %s, Key: %s, Value: %s, Error: %s', array(get_class($this), $key, $value, $e->getMessage()));
            }
            
            return $this;
        }
        
        // Remove
        public function remove($key, $object)
        {
            try
            {
                $databaseFieldsRev = array_flip($this->databaseFields);
                
                if (!array_key_exists($key, $this->databaseFields) && !in_array($key, $this->additionalFields) && !array_key_exists($key, $databaseFieldsRev))
                {
                    throw new Exception('Invalid data being set');
                }
                
                if (array_key_exists($key, $databaseFieldsRev))
                {
                    $key = $databaseFieldsRev[$key];
                }
                
                foreach ((array)$this->data[$key] AS $i => $data)
                {
                    if ($data->get('id') != $object->get('id'))
                    {
                        $newDataArray[] = $data;
                    }
                }
                
                $this->data[$key] = (array)$newDataArray;
            }
            catch (Exception $e)
            {
                $this->error('Remove Failed: Class: %s, Key: %s, Object: %s, Error: %s', array(get_class($this), $key, $object, $e->getMessage()));
            }
            
            return $this;
        }
        
        // Save
        public function save()
        {
            try
            {
                // Error checking
                if (!$this->isTableDefined())
                {
                    throw new Exception('No Table defined for this class');
                }
                
                // Variables
                $fieldData = array();
                $fieldsToUpdate = $this->databaseFields;
                $fieldToName = array_flip($this->databaseFields);
                
                // Remove unwanted fields for update query
                foreach ($this->databaseFields AS $name => $fieldName)
                {
                    if (in_array($name, $this->databaseFieldsToIgnore))
                    {
                        unset($fieldsToUpdate[$name]);
                    }
                }
                
                // Build insert key and value arrays
                foreach ($this->databaseFields AS $name => $fieldName)
                {
                    $insertKeys[] = $this->db->sanitize($fieldName);
                    $insertValues[] = $this->db->sanitize($this->get($name));
                }
                
                // Build update field array using filtered data
                foreach ($fieldsToUpdate AS $name => $fieldName)
                {
                    $updateData[] = sprintf("`%s`='%s'", $this->db->sanitize($fieldName), $this->db->sanitize($this->get($name)));
                }
                
                // Insert & Update query all-in-one
                $query = sprintf("INSERT INTO `%s` (`%s`) VALUES ('%s') ON DUPLICATE KEY UPDATE %s",
                    $this->db->sanitize($this->databaseTable),
                    implode("`, `", $insertKeys),
                    implode("', '", $insertValues),
                    implode(', ', $updateData)
                );
                
                // INFO
                $this->info($query);

                if (!$this->db->query($query))
                {
                    // Query failed
                    throw new Exception($this->db->error());
                }
                
                // Database query was successful - set ID if ID was not set
                if (!$this->get('id'))
                {
                    $this->set('id', $this->db->insert_id());
                }
                
                // Success
                return true;
            }
            catch (Exception $e)
            {
                $this->error('Database Save Failed: Class: %s, ID: %s, Error: %s', array(get_class($this), $this->get('id'), $e->getMessage()));
            }
        
            // Fail
            return false;
        }
        
        // Load
        public function load($field = 'id')
        {
            try
            {
                // Error checking
                if (!$this->isTableDefined())
                {
                    throw new Exception('No Table defined for this class');
                }
                if (!$this->get($field))
                {
                    throw new Exception(sprintf('Operation field not set: %s', strtoupper($field)));
                }
                
                // Variables
                $fieldToName = array_flip($this->databaseFields);
                
                // Build query
                if (is_array($this->get($field)))
                {
                    // Multiple values
                    foreach ($this->get($field) AS $fieldValue)
                    {
                        $fieldData[] = sprintf("`%s`='%s'", $this->db->sanitize($this->databaseFields[$field]), $this->db->sanitize($fieldValue));
                    }
                    
                    $query = sprintf("SELECT * FROM `%s` WHERE %s",
                        $this->db->sanitize($this->databaseTable),
                        implode(' OR ', $fieldData)
                    );
                }
                else
                {
                    // Single value
                    $query = sprintf("SELECT * FROM `%s` WHERE `%s`='%s'",
                        $this->db->sanitize($this->databaseTable),
                        $this->db->sanitize($this->databaseFields[$field]),
                        $this->db->sanitize($this->get($field))
                    );
                }
                
                // INFO
                $this->info($query);
                
                // Did we find a row in the database?
                if (!$queryData = $this->db->query($query)->fetch()->get())
                {
                    throw new Exception($this->db->error());
                }
                
                // Loop returned rows -> Set new data
                foreach ($queryData AS $key => $value)
                {
                    $this->set($fieldToName[$key], (string)$value);
                }
                
                // Success
                return true;
            }
            catch (Exception $e)
            {
                $this->error('Database Load Failed: Class: %s, ID: %s, Error: %s', array(get_class($this), $this->get('id'), $e->getMessage()));
            }
        
            // Fail
            return false;
        }
        
        // Destroy
        public function destroy($field = 'id')
        {
            try
            {
                // Error checking
                if (!$this->isTableDefined())
                {
                    throw new Exception('No Table defined for this class');
                }
                if (!$this->get($field))
                {
                    throw new Exception(sprintf('Operation field not set: %s', strtoupper($field)));
                }
                
                // Variables
                $fieldToName = array_flip($this->databaseFields);
                
                // Query row data
                $query = sprintf("DELETE FROM `%s` WHERE `%s`='%s'",
                    $this->db->sanitize($this->databaseTable),
                    $this->db->sanitize($this->databaseFields[$field]),
                    $this->db->sanitize($this->get($field))
                );
                
                // INFO
                $this->info($query);
                
                // Did we find a row in the database?
                if (!$queryData = $this->db->query($query)->fetch()->get())
                {
                    throw new Exception('Failed to delete');
                }
                
                // Success
                return true;
            }
            catch (Exception $e)
            {
                $this->error('Database Destroy Failed: Class: %s, ID: %s, Error: %s', array(get_class($this), $this->get('id'), $e->getMessage()));
            }
        
            // Fail
            return false;
        }
        
        // Error
        public function error($txt, $data = array())
        {
            if ($this->debug)
            {
                $txt = (is_array($data) && count($data) ? vsprintf($txt, $data) : $txt);
            
                $GLOBALS['FOGCore']->error(sprintf('Class: %s, Error: %s', get_class($this), $txt));
            }
        }
        
        // Info
        public function info($txt, $data = array())
        {
            if ($this->debug)
            {
                $txt = (is_array($data) && count($data) ? vsprintf($txt, $data) : $txt);
            
                $GLOBALS['FOGCore']->info(sprintf('Class: %s, Info: %s', get_class($this), $txt));
            }
        }
        
        // isValid
        public function isValid()
        {
            // TODO: Add $this->databaseFieldsRequired checks
            
            if ($this->get('id') || $this->get('name'))
            {
                return true;
            }
            
            return false;
        }
        
        // isTableDefined 
        private function isTableDefined()
        {
            return (!empty($this->databaseTable) ? true : false);
        }
        
        // Name is returned if class is printed
        public function __toString()
        {
            return $this->get('name');
        }
    }

[Category:Development](Category:Development "wikilink")
